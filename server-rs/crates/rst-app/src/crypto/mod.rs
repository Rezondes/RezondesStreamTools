//! Cryptography of the use cases: authenticated encryption and lookup digests.

pub mod cipher;
pub mod lookup;

/// Lower case hex digits of the bytes
#[must_use]
pub fn to_hex(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    bytes.iter().flat_map(|byte| [HEX[usize::from(byte >> 4)], HEX[usize::from(byte & 15)]]).map(char::from).collect()
}

#[cfg(test)]
mod tests {
    #[test]
    fn hex_of_bytes() {
        assert_eq!(super::to_hex(&[0x00, 0xab, 0x0f, 0xff]), "00ab0fff");
        assert_eq!(super::to_hex(&[]), "");
    }
}
