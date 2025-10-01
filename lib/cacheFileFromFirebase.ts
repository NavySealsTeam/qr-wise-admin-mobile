import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

export const cacheFileFromUrl = async (downloadUrl: string) => {
  // Create a safe filename by hashing the URL
  const hashedName = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    downloadUrl,
  );

  // Get file extension from URL (e.g. .webp, .jpg, .pdf)
  const match = downloadUrl.match(/\.(\w+)(\?|$)/);
  const extension = match ? `.${match[1]}` : '.bin';

  const fileUri = `${FileSystem.documentDirectory}${hashedName}${extension}`;

  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  if (fileInfo.exists) {
    return fileUri;
  }

  // Download and cache the file
  const downloaded = await FileSystem.downloadAsync(downloadUrl, fileUri);
  return downloaded.uri;
};

export const deleteCachedFileFromUrl = async (downloadUrl: string) => {
  const hashedName = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    downloadUrl,
  );

  const files = await FileSystem.readDirectoryAsync(
    FileSystem.documentDirectory!,
  );

  for (const file of files) {
    if (file.startsWith(hashedName)) {
      const fileUri = `${FileSystem.documentDirectory}${file}`;
      console.log('Deleting cached file:', fileUri); // Optional: for debug
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (err) {
        console.error('Error deleting file:', fileUri, err);
      }
    }
  }
};
