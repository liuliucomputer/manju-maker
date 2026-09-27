using System;
using System.IO;
using System.Runtime.InteropServices;

class IconReplacer
{
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern IntPtr BeginUpdateResource(string pFileName, bool bDeleteExistingResources);

    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern bool UpdateResource(IntPtr hUpdate, ushort lpType, ushort lpName, ushort wLanguage, byte[] lpData, uint cbData);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool EndUpdateResource(IntPtr hUpdate, bool fDiscard);

    const ushort RT_ICON = 3;
    const ushort RT_GROUP_ICON = 14;

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
            Console.WriteLine("Error: EXE not found: " + exePath);
            return;
        }
        if (!File.Exists(icoPath))
        {
            Console.WriteLine("Error: ICO not found: " + icoPath);
            return;
        }

        byte[] icoData = File.ReadAllBytes(icoPath);
        Console.WriteLine("ICO file size: " + icoData.Length + " bytes");

        IntPtr hUpdate = BeginUpdateResource(exePath, false);
        if (hUpdate == IntPtr.Zero)
        {
            Console.WriteLine("BeginUpdateResource failed: " + Marshal.GetLastWin32Error());
            return;
        }

        bool success = UpdateResource(hUpdate, RT_GROUP_ICON, (ushort)1, (ushort)0, icoData, (uint)icoData.Length);
        if (!success)
            Console.WriteLine("UpdateResource GROUP_ICON failed: " + Marshal.GetLastWin32Error());
        else
            Console.WriteLine("GROUP_ICON updated");

        success = UpdateResource(hUpdate, RT_ICON, (ushort)1, (ushort)0, icoData, (uint)icoData.Length);
        if (!success)
            Console.WriteLine("UpdateResource ICON failed: " + Marshal.GetLastWin32Error());
        else
            Console.WriteLine("ICON updated");

        if (EndUpdateResource(hUpdate, false))
            Console.WriteLine("Icon replaced successfully!");
        else
            Console.WriteLine("EndUpdateResource failed: " + Marshal.GetLastWin32Error());
    }
}