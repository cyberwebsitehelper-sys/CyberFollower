import boto3

s3 = boto3.client(
    "s3",
    endpoint_url="https://55267d4e507e11aa7b140742a68e523f.r2.cloudflarestorage.com",
    aws_access_key_id="61175755a72c8210ffcba4c0539f5a32",
    aws_secret_access_key="5111e78b0ca845602c2e0e5a9029ccce6b14e2f32ba954524e4d7c44afd44c15"
)

file_path = r"E:\ProjectFolder\CyberAdvNantuDa\CyberFollower\Frontend\public\Logo1.webp"

bucket_name = "cyberdatafiles"

s3.upload_file(
    file_path,
    bucket_name,
    "Logo1.webp"
)

print("Upload successful")