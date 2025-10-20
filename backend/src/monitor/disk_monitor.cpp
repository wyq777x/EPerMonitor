#include "monitor/disk_monitor.h"
#include <fstream>
#include <sstream>

#ifdef __linux__
#include <mntent.h>
#include <sys/statvfs.h>
#endif

#ifdef _WIN32
#ifndef NOMINMAX
#define NOMINMAX
#endif
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#elif defined(__APPLE__)
#include <sys/mount.h>
#endif

namespace epm
{

    std::vector<DiskInfo> DiskMonitor::getDiskInfo()
    {
        std::vector<DiskInfo> disks;

#if defined(__linux__)
        FILE *mtab = setmntent("/etc/mtab", "r");
        if (mtab == nullptr)
        {
            return disks;
        }

        struct mntent *entry;
        while ((entry = getmntent(mtab)) != nullptr)
        {
            std::string fstype(entry->mnt_type);
            if (fstype == "ext4" || fstype == "ext3" || fstype == "xfs" || fstype == "btrfs" || fstype == "ntfs" ||
                fstype == "vfat")
            {

                struct statvfs stat;
                if (statvfs(entry->mnt_dir, &stat) == 0)
                {
                    DiskInfo disk;
                    disk.name = entry->mnt_dir;
                    disk.total = stat.f_blocks * stat.f_frsize;
                    disk.free = stat.f_bavail * stat.f_frsize;
                    disk.used = disk.total - disk.free;

                    if (disk.total > 0)
                    {
                        disk.usagePercent = (static_cast<double>(disk.used) / disk.total) * 100.0;
                    }
                    else
                    {
                        disk.usagePercent = 0.0;
                    }

                    disks.push_back(disk);
                }
            }
        }

        endmntent(mtab);
#elif defined(_WIN32)
        DWORD driveMask = GetLogicalDrives();
        for (char drive = 'A'; drive <= 'Z'; ++drive)
        {
            if ((driveMask & (1u << (drive - 'A'))) == 0)
                continue;

            std::string rootPath;
            rootPath.push_back(drive);
            rootPath.append(":\\");

            UINT driveType = GetDriveTypeA(rootPath.c_str());
            if (driveType != DRIVE_FIXED && driveType != DRIVE_REMOVABLE && driveType != DRIVE_RAMDISK)
                continue;

            ULARGE_INTEGER freeBytesAvailable = {};
            ULARGE_INTEGER totalNumberOfBytes = {};
            ULARGE_INTEGER totalNumberOfFreeBytes = {};

            if (GetDiskFreeSpaceExA(rootPath.c_str(), &freeBytesAvailable, &totalNumberOfBytes, &totalNumberOfFreeBytes))
            {
                DiskInfo disk;
                disk.name = rootPath;
                disk.total = static_cast<unsigned long long>(totalNumberOfBytes.QuadPart);
                disk.free = static_cast<unsigned long long>(totalNumberOfFreeBytes.QuadPart);
                disk.used = disk.total >= disk.free ? disk.total - disk.free : 0;
                disk.usagePercent = disk.total > 0 ? (static_cast<double>(disk.used) / disk.total) * 100.0 : 0.0;
                disks.push_back(disk);
            }
        }
#elif defined(__APPLE__)
        struct statfs *mounts;
        int mountCount = getmntinfo(&mounts, MNT_NOWAIT);
        if (mountCount > 0)
        {
            for (int i = 0; i < mountCount; ++i)
            {
                if ((mounts[i].f_flags & MNT_LOCAL) == 0)
                    continue;

                DiskInfo disk;
                disk.name = mounts[i].f_mntonname;
                disk.total = static_cast<unsigned long long>(mounts[i].f_blocks) * mounts[i].f_bsize;
                disk.free = static_cast<unsigned long long>(mounts[i].f_bavail) * mounts[i].f_bsize;
                disk.used = disk.total >= disk.free ? disk.total - disk.free : 0;
                disk.usagePercent = disk.total > 0 ? (static_cast<double>(disk.used) / disk.total) * 100.0 : 0.0;
                disks.push_back(disk);
            }
        }
#endif

        return disks;
    }

} // namespace epm
