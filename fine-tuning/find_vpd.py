import os
import shutil
from pathlib import Path


def organize_vpd_files(source_folder, output_folder="./vpd"):
    output_path = Path(output_folder)
    output_path.mkdir(exist_ok=True)

    source_path = Path(source_folder)
    vpd_files = list(source_path.rglob("*.vpd"))

    print(f"Found {len(vpd_files)} VPD files")

    if len(vpd_files) == 0:
        print("No VPD files found!")
        return

    for i, vpd_file in enumerate(vpd_files, 1):
        new_filename = f"{i}.vpd"
        new_path = output_path / new_filename

        try:
            shutil.copy2(vpd_file, new_path)
            print(f"Copied: {vpd_file} -> {new_path}")
        except Exception as e:
            print(f"Error copying {vpd_file}: {e}")

    print(f"\nCompleted! {len(vpd_files)} VPD files organized in '{output_folder}' folder")
    print(f"Files numbered from 1.vpd to {len(vpd_files)}.vpd")


if __name__ == "__main__":
    source_folder = "C:/Users/jiach/Downloads/poses_vpd"
    organize_vpd_files(source_folder)
