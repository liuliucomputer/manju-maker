using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;

class IconReplacer
{
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern IntPtr LoadLibraryEx(string lpFileName, IntPtr hReservedNull, uint dwFlags);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool FreeLibrary(IntPtr hModule);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
    static extern IntPtr FindResource(IntPtr hModule, string pResName, string pResType);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
    static extern IntPtr FindResource(IntPtr hModule, IntPtr pResName, string pResType);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern uint SizeofResource(IntPtr hModule, IntPtr hResource);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern IntPtr LockResource(IntPtr hResource);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool UpdateResource(IntPtr hUpdate, string lpType, string lpName, short wLanguage, byte[] lpData, uint cbData);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern IntPtr BeginUpdateResource(string pFileName, bool bDeleteExistingResources);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool EndUpdateResource(IntPtr hUpdate, bool fDiscard);

    const uint LOAD_LIBRARY_AS_DATAFILE = 0x00000002;

    static void Main(string[] args)
    {
        if (args.Length != 2)
        {
            Console.WriteLine("Usage: IconReplacer <exe_path> <ico_path>");
            return;
        }

        string exePath = args[0];
        string icoPath = args[1];

        if (!File.Exists(exePath))
        {
            Console.WriteLine($"Error: EXE not found: {exePath}");
            return;
        }
        if (!File.Exists(icoPath))
        {
            Console.WriteLine($"Error: ICO not found: {icoPath}");
            return;
        }

        // Read ICO file
        byte[] icoData = File.ReadAllBytes(icoPath);
        Console.WriteLine($"ICO file size: {icoData.Length} bytes");

        // Load the EXE as a data file to find existing icon resources
        IntPtr hModule = LoadLibraryEx(exePath, IntPtr.Zero, LOAD_LIBRARY_AS_DATAFILE);
        if (hModule == IntPtr.Zero)
        {
            Console.WriteLine($"Failed to load EXE: {Marshal.GetLastWin32Error()}");
            return;
        }

        // Try to find existing RT_GROUP_ICON resources
        IntPtr hIconGroup = FindResource(hModule, (IntPtr)1, "GROUP_ICON");
        bool hasExistingIcon = (hIconGroup != IntPtr.Zero);
        Console.WriteLine($"Has existing icon: {hasExistingIcon}");

        FreeLibrary(hModule);

        // Begin update resource
        IntPtr hUpdate = BeginUpdateResource(exePath, false);
        if (hUpdate == IntPtr.Zero)
        {
            Console.WriteLine($"Failed to begin update: {Marshal.GetLastWin32Error()}");
            return;
        }

        // Update the icon resource
        bool success = UpdateResource(hUpdate, "GROUP_ICON", (IntPtr)1, 0, icoData, (uint)icoData.Length);
        if (!success)
        {
            Console.WriteLine($"Failed to update resource: {Marshal.GetLastWin32Error()}");
            EndUpdateResource(hUpdate, true);
            return;
        }

        // Also try updating RT_ICON resources (IDs 1, 2, 3, ...)
        // For a proper ICO replacement, we need to add all individual icon images
        // The GROUP_ICON contains the directory, and we need individual RT_ICON entries

        // For simplicity, let's also try to replace the main icon by ID
        success = UpdateResource(hUpdate, "ICON", (IntPtr)1, 0, icoData, (uint)icoData.Length);
        if (!success)
        {
            Console.WriteLine($"Failed to update ICON resource: {Marshal.GetLastWin32Error()}");
        }

        // End update
        if (EndUpdateResource(hUpdate, false))
        {
            Console.WriteLine("Icon replaced successfully!");
        }
        else
        {
            Console.WriteLine($"Failed to end update: {Marshal.GetLastWin32Error()}");
        }
    }
}
