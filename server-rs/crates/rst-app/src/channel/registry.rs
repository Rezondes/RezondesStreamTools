//! Running streamer runtimes, exactly one per streamer (template: `server/runtimeRegistry.ts`). A start waits for
//! data and connections; if someone else starts or stops the same streamer meanwhile (second login, admin saves
//! access, disconnect), the overtaken start is discarded instead of leaving a second runtime nobody manages.

use std::collections::HashMap;
use std::future::Future;
use std::sync::{Arc, Mutex, MutexGuard};

use rst_domain::identity::values::StreamerId;

pub trait Runtime: Send + Sync {
    fn stop(&self);

    /// A runtime that ended itself (e.g. its login became invalid) no longer counts
    fn stopped(&self) -> bool;
}

struct Entries<R> {
    runtimes: HashMap<StreamerId, Arc<R>>,
    generations: HashMap<StreamerId, u64>,
}

pub struct Registry<R> {
    entries: Mutex<Entries<R>>,
}

impl<R> Default for Registry<R> {
    fn default() -> Self {
        Self { entries: Mutex::new(Entries { runtimes: HashMap::new(), generations: HashMap::new() }) }
    }
}

impl<R: Runtime> Registry<R> {
    fn entries(&self) -> MutexGuard<'_, Entries<R>> {
        self.entries.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    #[must_use]
    pub fn get(&self, id: &StreamerId) -> Option<Arc<R>> {
        self.entries().runtimes.get(id).filter(|runtime| !runtime.stopped()).cloned()
    }

    #[must_use]
    pub fn ids(&self) -> Vec<StreamerId> {
        self.entries().runtimes.iter().filter(|(_, runtime)| !runtime.stopped()).map(|(id, _)| id.clone()).collect()
    }

    /// Stops the runtime and every start of it that is running right now
    pub fn stop(&self, id: &StreamerId) {
        let removed = {
            let mut entries = self.entries();
            *entries.generations.entry(id.clone()).or_insert(0) += 1;
            entries.runtimes.remove(id)
        };
        if let Some(runtime) = removed {
            runtime.stop();
        }
    }

    pub fn stop_all(&self) {
        let ids: Vec<StreamerId> = {
            let entries = self.entries();
            entries.runtimes.keys().chain(entries.generations.keys()).cloned().collect()
        };
        for id in ids {
            self.stop(&id);
        }
    }

    /// `create` builds the runtime (`None` = nothing to start); `allowed` is checked again afterwards
    pub async fn start<C, A>(&self, id: &StreamerId, create: C, allowed: A) -> Option<Arc<R>>
    where
        C: Future<Output = Option<R>>,
        A: Future<Output = bool>,
    {
        self.stop(id);
        let mine = self.entries().generations.get(id).copied();
        let runtime = Arc::new(create.await?);
        let allowed = allowed.await;
        let mut entries = self.entries();
        if entries.generations.get(id).copied() != mine || !allowed {
            drop(entries);
            runtime.stop();
            return None;
        }
        entries.runtimes.insert(id.clone(), Arc::clone(&runtime));
        Some(runtime)
    }
}

#[cfg(test)]
mod tests {
    use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};

    use tokio::sync::oneshot;

    use super::*;

    static NEXT: AtomicU32 = AtomicU32::new(1);

    #[derive(Debug)]
    struct Fake {
        id: u32,
        stopped: AtomicBool,
    }

    impl Fake {
        fn new() -> Self {
            Self { id: NEXT.fetch_add(1, Ordering::SeqCst), stopped: AtomicBool::new(false) }
        }
    }

    impl Runtime for Fake {
        fn stop(&self) {
            self.stopped.store(true, Ordering::SeqCst);
        }

        fn stopped(&self) -> bool {
            self.stopped.load(Ordering::SeqCst)
        }
    }

    fn id(name: u8) -> StreamerId {
        StreamerId::from_bytes([name; 16])
    }

    /// A start that only finishes on `release` (like reading data and opening connections)
    fn held() -> (oneshot::Sender<()>, impl Future<Output = Option<Fake>>) {
        let (release, wait) = oneshot::channel::<()>();
        (release, async move { wait.await.ok().map(|()| Fake::new()) })
    }

    fn yes() -> std::future::Ready<bool> {
        std::future::ready(true)
    }

    #[tokio::test]
    async fn a_restart_stops_the_old_runtime() {
        let registry = Registry::default();
        let first = registry.start(&id(1), async { Some(Fake::new()) }, yes()).await.expect("first");
        let second = registry.start(&id(1), async { Some(Fake::new()) }, yes()).await.expect("second");
        assert!(first.stopped());
        assert_eq!(registry.get(&id(1)).map(|runtime| runtime.id), Some(second.id));
        assert_eq!(registry.ids(), [id(1)]);
    }

    #[tokio::test]
    async fn of_two_starts_at_once_only_the_newer_stays() {
        let registry = Registry::default();
        let two = id(2);
        let (release_older, older) = held();
        let (release_newer, newer) = held();
        let (older, newer) = tokio::join!(registry.start(&two, older, yes()), async {
            tokio::task::yield_now().await;
            let started = registry.start(&two, newer, yes());
            release_newer.send(()).expect("release newer");
            release_older.send(()).expect("release older");
            started.await
        });
        assert!(older.is_none());
        let newer = newer.expect("newer");
        assert_eq!(registry.get(&two).map(|runtime| runtime.id), Some(newer.id));
    }

    #[tokio::test]
    async fn locked_or_stopped_starts_are_discarded() {
        let registry = Registry::<Fake>::default();
        let (three, five) = (id(3), id(5));
        let (release, start) = held();
        let (started, ()) = tokio::join!(registry.start(&three, start, yes()), async {
            tokio::task::yield_now().await;
            registry.stop(&three);
            release.send(()).expect("release");
        });
        assert!(started.is_none());
        assert!(registry.get(&three).is_none());
        let refused = registry.start(&id(4), async { Some(Fake::new()) }, std::future::ready(false)).await;
        assert!(refused.is_none());
        let (release, start) = held();
        let (started, ()) = tokio::join!(registry.start(&five, start, yes()), async {
            tokio::task::yield_now().await;
            registry.stop_all();
            release.send(()).expect("release");
        });
        assert!(started.is_none());
        assert!(registry.ids().is_empty());
    }

    #[tokio::test]
    async fn nothing_to_start_and_runtimes_that_ended_themselves() {
        let registry = Registry::<Fake>::default();
        assert!(registry.start(&id(1), async { None }, yes()).await.is_none());
        let current = registry.start(&id(1), async { Some(Fake::new()) }, yes()).await.expect("current");
        assert!(registry.get(&id(1)).is_some());
        current.stop();
        assert!(registry.get(&id(1)).is_none());
        assert!(registry.ids().is_empty());
    }
}
