### GCP Clean up inactive files
### Overview
The `cleanupInactiveFiles` method in `GoogleCloudStorageProvider` class is designed to automatically delete files from Google Cloud Storage (GCS) that have not been accessed within a configurable time frame (inactivityPeriodMs).

A primary challenge was tracking the last access time for each file. Google Cloud Storage does not natively provide a last_accessed_time metadata field that automatically updates when a file is read or downloaded.

While it's possible to manually update a custom metadata field on each download, this approach is impractical as it would introduce significant performance overhead. Each download (a read operation) would require an additional write operation to update the metadata, increasing latency and API usage costs.

To overcome this, server-side tracking mechanism was implemented using a static, in-memory Map called `accessMap`. It is using as a temporary DB. For production use cases, a more persistent storage solution like Redis or a database would be recommended to ensure data durability across server restarts.

### How it Works
This Map stores a file's unique publicKey as the key and a Date object representing its last access time as the value. When a file is uploaded or downloaded, the map is updated with the current timestamp.

### The cleanup process executes the following steps:

1. Iterate Tracked Files: The function iterates through every entry in the static accessMap.
2. Calculate Inactivity: For each file, it calculates the duration since its last access by comparing the stored timestamp to the current time.
3. Check Against Threshold: If the inactive duration exceeds the configured inactivityPeriodMs, the file is marked for deletion.
4. Delete from GCS: The function issues commands to Google Cloud Storage to delete both the file and its corresponding .meta.json file.
5. Update Internal State: Upon successful deletion from GCS, the file's entry is removed from the accessMap to stop tracking it.
