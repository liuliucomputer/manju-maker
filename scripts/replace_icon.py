"""
Replace icon resource in an EXE file using pefile.
Usage: python replace_icon.py <exe_path> <ico_path>
"""
import sys
import pefile


def replace_icon(exe_path, ico_path):
    # Load the PE file
    pe = pefile.PE(exe_path)

    # Find the icon directory
    ICON_TYPE = 3  # RT_ICON
    ICON_GROUP_TYPE = 14  # RT_GROUP_ICON

    print(f"Original EXE size: {pe.get_file_size() if hasattr(pe, 'get_file_size') else 'N/A'}")

    # Read the ICO file
    with open(ico_path, 'rb') as f:
        ico_data = f.read()

    print(f"ICO data size: {len(ico_data)} bytes")

    # Check if there's an existing icon resource
    has_icon = False
    if hasattr(pe, 'DIRECTORY_ENTRY_RESOURCE') and pe.DIRECTORY_ENTRY_RESOURCE:
        for entry in pe.DIRECTORY_ENTRY_RESOURCE.entries:
            if entry.id == pefile.RESOURCE_TYPE['RT_ICON']:
                has_icon = True
                print("Found existing icon resource")
                break
            if entry.id == pefile.RESOURCE_TYPE['RT_GROUP_ICON']:
                has_icon = True
                print("Found existing icon group resource")
                break

    if not has_icon:
        print("No existing icon resource found. Will add one.")

    # Use Win32 API via ctypes for proper resource updating
    import ctypes
    from ctypes import wintypes

    kernel32 = ctypes.windll.kernel32

    # BeginUpdateResource
    hUpdate = kernel32.BeginUpdateResourceW(exe_path, False)
    if not hUpdate or hUpdate == ctypes.c_void_p(-1).value:
        print(f"BeginUpdateResource failed: {ctypes.get_last_error()}")
        return False

    # UpdateResource for GROUP_ICON (ID 14)
    RT_GROUP_ICON = ctypes.c_int(14)
    RT_ICON = ctypes.c_int(3)
    MAKEINTRESOURCE = lambda x: ctypes.cast(ctypes.c_int(x), ctypes.c_wchar_p)

    # Update GROUP_ICON
    result = kernel32.UpdateResourceW(
        hUpdate,
        RT_GROUP_ICON,
        MAKEINTRESOURCE(1),
        0,  # language neutral
        ico_data,
        len(ico_data)
    )
    if not result:
        print(f"UpdateResource GROUP_ICON failed: {ctypes.get_last_error()}")

    # Also try updating individual ICON entries
    result = kernel32.UpdateResource(
        hUpdate,
        RT_ICON,
        MAKEINTRESOURCE(1),
        0,
        ico_data,
        len(ico_data)
    )
    if not result:
        print(f"UpdateResource ICON failed: {ctypes.get_last_error()}")
    else:
        print("Icon resource updated successfully")

    # EndUpdateResource (commit changes)
    result = kernel32.EndUpdateResourceW(hUpdate, False)
    if not result:
        print(f"EndUpdateResource failed: {ctypes.get_last_error()}")
        return False

    print(f"Icon replaced successfully!")
    print(f"New EXE size should be similar to original")
    return True


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python replace_icon.py <exe_path> <ico_path>")
        sys.exit(1)

    exe_path = sys.argv[1]
    ico_path = sys.argv[2]

    replace_icon(exe_path, ico_path)
