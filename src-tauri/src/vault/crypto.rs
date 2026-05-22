use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Argon2,
};
use rand::RngCore;
use ring::aead::{BoundKey, Nonce, NonceSequence, OpeningKey, SealingKey, UnboundKey, AES_256_GCM};
use zeroize::{Zeroize, ZeroizeOnDrop};

pub const KEY_SIZE: usize = 32;
pub const NONCE_SIZE: usize = 12;
pub const TAG_SIZE: usize = 16;

#[derive(Zeroize, ZeroizeOnDrop)]
pub struct VaultKey(pub [u8; KEY_SIZE]);

pub fn derive_key(password: &str, salt: &[u8]) -> Result<VaultKey, anyhow::Error> {
    let mut key = [0u8; KEY_SIZE];
    let argon2 = Argon2::default();

    let salt_string = SaltString::from_b64(std::str::from_utf8(salt)?)
        .map_err(|e| anyhow::anyhow!("Invalid salt: {}", e))?;

    let hash = argon2
        .hash_password(password.as_bytes(), &salt_string)
        .map_err(|e| anyhow::anyhow!("Hashing failed: {}", e))?;

    let derived_bytes = hash.hash.ok_or_else(|| anyhow::anyhow!("No hash output"))?;

    if derived_bytes.len() < KEY_SIZE {
        return Err(anyhow::anyhow!("Derived key too short"));
    }

    key.copy_from_slice(&derived_bytes.as_bytes()[..KEY_SIZE]);

    Ok(VaultKey(key))
}

struct OneTimeNonceSequence(Option<Nonce>);

impl NonceSequence for OneTimeNonceSequence {
    fn advance(&mut self) -> Result<Nonce, ring::error::Unspecified> {
        self.0.take().ok_or(ring::error::Unspecified)
    }
}

pub fn encrypt(data: &[u8], key: &VaultKey) -> Result<Vec<u8>, anyhow::Error> {
    let mut nonce_bytes = [0u8; NONCE_SIZE];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);

    let unbound_key = UnboundKey::new(&AES_256_GCM, &key.0)
        .map_err(|_| anyhow::anyhow!("Failed to create key"))?;

    let mut sealing_key = SealingKey::new(
        unbound_key,
        OneTimeNonceSequence(Some(Nonce::assume_unique_for_key(nonce_bytes))),
    );

    let mut in_out = data.to_vec();
    sealing_key
        .seal_in_place_append_tag(ring::aead::Aad::empty(), &mut in_out)
        .map_err(|_| anyhow::anyhow!("Encryption failed"))?;

    let mut result = nonce_bytes.to_vec();
    result.extend_from_slice(&in_out);

    Ok(result)
}

pub fn decrypt(encrypted_data: &[u8], key: &VaultKey) -> Result<Vec<u8>, anyhow::Error> {
    if encrypted_data.len() < NONCE_SIZE + TAG_SIZE {
        return Err(anyhow::anyhow!("Data too short"));
    }

    let (nonce_bytes, ciphertext) = encrypted_data.split_at(NONCE_SIZE);
    let mut in_out = ciphertext.to_vec();

    let mut nonce_arr = [0u8; NONCE_SIZE];
    nonce_arr.copy_from_slice(nonce_bytes);

    let unbound_key = UnboundKey::new(&AES_256_GCM, &key.0)
        .map_err(|_| anyhow::anyhow!("Failed to create key"))?;

    let mut opening_key = OpeningKey::new(
        unbound_key,
        OneTimeNonceSequence(Some(Nonce::assume_unique_for_key(nonce_arr))),
    );

    let decrypted_data = opening_key
        .open_in_place(ring::aead::Aad::empty(), &mut in_out)
        .map_err(|_| anyhow::anyhow!("Decryption failed"))?;

    Ok(decrypted_data.to_vec())
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_decryption() {
        let key = VaultKey([0x42; KEY_SIZE]);
        let data = b"Hello, Termiaxial!";

        let encrypted = encrypt(data, &key).expect("Encryption failed");
        let decrypted = decrypt(&encrypted, &key).expect("Decryption failed");

        assert_eq!(data, &decrypted[..]);
    }
}
