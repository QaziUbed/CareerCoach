import os
from core.database import supabase

# IMPORTANT SETUP INSTRUCTIONS FOR SUPABASE STORAGE:
# 1. Open your Supabase Dashboard -> "Storage"
# 2. Click "New bucket" and name it EXACTLY: "user-files"
# 3. Create the bucket as a "Private bucket"
# 4. Set RLS (Row Level Security) Policies on the bucket:
#    - Create policy: Authenticated users can INSERT/SELECT/UPDATE/DELETE
#    - Policy definition logic should check that the `storage_path` starts with their user UID
#      Example: (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text)

BUCKET_NAME = "user-files"

async def upload_file(local_path: str, storage_path: str) -> str:
    """
    Reads a file from the local filesystem and uploads it to Supabase Storage.
    
    Args:
        local_path (str): The absolute or relative path to the local file.
        storage_path (str): The destination path inside the 'user-files' bucket 
                            (e.g., 'resumes/USER_ID/resume.pdf').
                            
    Returns:
        str: The public URL of the uploaded file.
        
    Raises:
        FileNotFoundError: If the local file does not exist.
        Exception: If the upload fails via the Supabase client.
    """
    if not os.path.exists(local_path):
        raise FileNotFoundError(f"The file {local_path} could not be found.")

    with open(local_path, "rb") as f:
        file_bytes = f.read()

    try:
        # Pass the bytes array securely to Supabase Storage
        supabase.storage.from_(BUCKET_NAME).upload(
            path=storage_path, 
            file=file_bytes, 
            file_options={"upsert": "true"}
        )
    except Exception as e:
        raise Exception(f"Failed to upload file to Supabase Storage: {str(e)}")

    # Retrieve the public URL for the newly uploaded file 
    # (Note: for private buckets this generates a non-signed public-format URL, 
    # if strictly private you may need create_signed_url instead down the road, 
    # but returning get_public_url as requested)
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)
    return public_url


async def download_file(storage_path: str, local_path: str) -> None:
    """
    Downloads a file from Supabase Storage securely to the local filesystem.
    
    Args:
        storage_path (str): The exact structural path where the file lives in the bucket.
        local_path (str): The target destination path to save the file locally.
        
    Raises:
        Exception: If the download fails or the file doesn't exist remotely.
    """
    try:
        res = supabase.storage.from_(BUCKET_NAME).download(storage_path)
    except Exception as e:
        raise Exception(f"Failed to download file from Supabase: {str(e)}")
        
    # Write the downloaded binary data directly to the specified local path
    with open(local_path, "wb") as f:
        f.write(res)


async def delete_file(storage_path: str) -> None:
    """
    Deletes a specific file from the Supabase Storage bucket.
    
    Args:
        storage_path (str): The exact structural path of the file to delete.
        
    Raises:
        Exception: If the file deletion operation fails remotely.
    """
    try:
        # Supabase historically expects paths as an array for deletion 
        supabase.storage.from_(BUCKET_NAME).remove([storage_path])
    except Exception as e:
        raise Exception(f"Failed to delete file from Supabase Storage: {str(e)}")
