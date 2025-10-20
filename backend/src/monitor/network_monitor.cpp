#include <chrono>
#include "monitor/network_monitor.h"
#include <cstring>
#include <fstream>
#include <iomanip>
#include <map>
#include <mutex>
#include <sstream>
#include <utility>
#include <vector>

#if defined(__linux__) || defined(__APPLE__)
#include <arpa/inet.h>
#include <ifaddrs.h>
#include <net/if.h>
#include <netinet/in.h>
#include <sys/socket.h>
#endif

#ifdef __APPLE__
#include <net/if_dl.h>
#endif

#ifdef _WIN32
#ifndef NOMINMAX
#define NOMINMAX
#endif
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <winsock2.h>
#include <windows.h>
#include <ws2tcpip.h>
#include <iphlpapi.h>
#include <ws2ipdef.h>
#include <iphlpapi.h>
#pragma comment(lib, "iphlpapi.lib")
#pragma comment(lib, "ws2_32.lib")
#endif

namespace epm
{

    namespace
    {
        struct InterfaceSnapshot
        {
            unsigned long long rxBytes = 0;
            unsigned long long txBytes = 0;
            std::chrono::steady_clock::time_point timestamp = std::chrono::steady_clock::now();
        };
    }

    std::vector<NetworkInterface> NetworkMonitor::getNetworkInfo()
    {
        std::vector<NetworkInterface> interfaces;
        const auto now = std::chrono::steady_clock::now();
        static std::map<std::string, InterfaceSnapshot> previousStats;
        static std::mutex statsMutex;

#if defined(__linux__)
        struct ifaddrs *ifaddr;
        if (getifaddrs(&ifaddr) == -1)
        {
            return interfaces;
        }

        std::map<std::string, NetworkInterface> ifaceMap;

        // Collect IPv4 addresses
        for (struct ifaddrs *ifa = ifaddr; ifa != nullptr; ifa = ifa->ifa_next)
        {
            if (ifa->ifa_addr == nullptr)
                continue;

            int family = ifa->ifa_addr->sa_family;
            if (family == AF_INET)
            {
                std::string name(ifa->ifa_name);

                // Skip loopback interfaces
                if (name == "lo")
                    continue;

                NetworkInterface &iface = ifaceMap[name];
                iface.name = name;

                char addr[INET_ADDRSTRLEN];
                inet_ntop(AF_INET, &((struct sockaddr_in *)ifa->ifa_addr)->sin_addr, addr, INET_ADDRSTRLEN);
                iface.ip = addr;
            }
        }

        freeifaddrs(ifaddr);

        // Parse network statistics
        std::ifstream netdev("/proc/net/dev");
        if (netdev.is_open())
        {
            std::string line;
            // Skip header lines
            std::getline(netdev, line);
            std::getline(netdev, line);

            while (std::getline(netdev, line))
            {
                std::istringstream iss(line);
                std::string name;
                iss >> name;

                // Drop trailing colon
                if (!name.empty() && name.back() == ':')
                {
                    name.pop_back();
                }

                if (ifaceMap.find(name) != ifaceMap.end())
                {
                    unsigned long long rxBytes = 0;
                    unsigned long long rxPackets = 0;
                    unsigned long long rxErrors = 0;
                    unsigned long long rxDrop = 0;
                    unsigned long long rxFifo = 0;
                    unsigned long long rxFrame = 0;
                    unsigned long long rxCompressed = 0;
                    unsigned long long rxMulticast = 0;
                    unsigned long long txBytes = 0;
                    unsigned long long txPackets = 0;
                    unsigned long long txErrors = 0;
                    unsigned long long txDrop = 0;
                    unsigned long long txFifo = 0;
                    unsigned long long txColls = 0;
                    unsigned long long txCarrier = 0;
                    unsigned long long txCompressed = 0;

                    iss >> rxBytes >> rxPackets >> rxErrors >> rxDrop >> rxFifo >> rxFrame >> rxCompressed >> rxMulticast;
                    iss >> txBytes >> txPackets >> txErrors >> txDrop >> txFifo >> txColls >> txCarrier >> txCompressed;

                    ifaceMap[name].rxBytes = rxBytes;
                    ifaceMap[name].txBytes = txBytes;
                    ifaceMap[name].rxSpeed = 0; // TODO: compute delta-based rate
                    ifaceMap[name].txSpeed = 0;
                }
            }
        }

        // Convert map to vector
        for (const auto &pair : ifaceMap)
        {
            interfaces.push_back(pair.second);
        }
#elif defined(_WIN32)
        WSADATA wsaData;
        if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0)
        {
            return interfaces;
        }

        ULONG flags = GAA_FLAG_INCLUDE_PREFIX;
        ULONG family = AF_UNSPEC;
        ULONG bufferLength = 15000;
        std::vector<unsigned char> buffer(bufferLength);
        PIP_ADAPTER_ADDRESSES addresses = reinterpret_cast<PIP_ADAPTER_ADDRESSES>(buffer.data());

        ULONG result = GetAdaptersAddresses(family, flags, nullptr, addresses, &bufferLength);
        if (result == ERROR_BUFFER_OVERFLOW)
        {
            buffer.resize(bufferLength);
            addresses = reinterpret_cast<PIP_ADAPTER_ADDRESSES>(buffer.data());
            result = GetAdaptersAddresses(family, flags, nullptr, addresses, &bufferLength);
        }

        auto wideToUtf8 = [](const wchar_t *input) -> std::string
        {
            if (input == nullptr)
                return std::string();
            int required = WideCharToMultiByte(CP_UTF8, 0, input, -1, nullptr, 0, nullptr, nullptr);
            if (required <= 0)
                return std::string();
            std::string output(static_cast<size_t>(required - 1), '\0');
            WideCharToMultiByte(CP_UTF8, 0, input, -1, output.data(), required, nullptr, nullptr);
            return output;
        };

        if (result == NO_ERROR)
        {
            for (PIP_ADAPTER_ADDRESSES adapter = addresses; adapter != nullptr; adapter = adapter->Next)
            {
                if (adapter->IfType == IF_TYPE_SOFTWARE_LOOPBACK || adapter->OperStatus != IfOperStatusUp)
                    continue;

                NetworkInterface iface;
                iface.name = wideToUtf8(adapter->FriendlyName);
                if (iface.name.empty())
                    iface.name = adapter->AdapterName ? adapter->AdapterName : "";

                if (adapter->PhysicalAddressLength > 0)
                {
                    std::ostringstream macStream;
                    macStream << std::uppercase << std::hex << std::setfill('0');
                    for (ULONG i = 0; i < adapter->PhysicalAddressLength; ++i)
                    {
                        if (i > 0)
                            macStream << ":";
                        macStream << std::setw(2) << static_cast<unsigned int>(adapter->PhysicalAddress[i]);
                    }
                    iface.mac = macStream.str();
                }

                for (PIP_ADAPTER_UNICAST_ADDRESS unicast = adapter->FirstUnicastAddress; unicast != nullptr; unicast = unicast->Next)
                {
                    if (unicast->Address.lpSockaddr == nullptr)
                        continue;

                    int family = unicast->Address.lpSockaddr->sa_family;
                    char addressBuffer[INET6_ADDRSTRLEN] = {0};

                    if (family == AF_INET)
                    {
                        auto *sockAddrIn = reinterpret_cast<sockaddr_in *>(unicast->Address.lpSockaddr);
                        if (inet_ntop(AF_INET, &sockAddrIn->sin_addr, addressBuffer, sizeof(addressBuffer)) != nullptr)
                        {
                            iface.ip = addressBuffer;
                            break;
                        }
                    }
                    else if (family == AF_INET6)
                    {
                        auto *sockAddrIn6 = reinterpret_cast<sockaddr_in6 *>(unicast->Address.lpSockaddr);
                        if (inet_ntop(AF_INET6, &sockAddrIn6->sin6_addr, addressBuffer, sizeof(addressBuffer)) != nullptr)
                        {
                            iface.ip = addressBuffer;
                        }
                    }
                }

                MIB_IF_ROW2 row;
                std::memset(&row, 0, sizeof(row));
                row.InterfaceLuid = adapter->Luid;
                if (GetIfEntry2(&row) == NO_ERROR)
                {
                    iface.rxBytes = row.InOctets;
                    iface.txBytes = row.OutOctets;
                }

                iface.rxSpeed = 0;
                iface.txSpeed = 0;

                interfaces.push_back(std::move(iface));
            }
        }

        WSACleanup();
#elif defined(__APPLE__)
        struct ifaddrs *ifaddr;
        if (getifaddrs(&ifaddr) != 0)
        {
            return interfaces;
        }

        std::map<std::string, NetworkInterface> ifaceMap;

        for (struct ifaddrs *ifa = ifaddr; ifa != nullptr; ifa = ifa->ifa_next)
        {
            if (ifa->ifa_addr == nullptr)
                continue;

            int family = ifa->ifa_addr->sa_family;
            std::string name(ifa->ifa_name);

            if (name == "lo0")
                continue;

            NetworkInterface &iface = ifaceMap[name];
            iface.name = name;

            if (family == AF_INET || family == AF_INET6)
            {
                char addr[INET6_ADDRSTRLEN];
                if (family == AF_INET)
                {
                    inet_ntop(AF_INET, &reinterpret_cast<struct sockaddr_in *>(ifa->ifa_addr)->sin_addr, addr, sizeof(addr));
                }
                else
                {
                    inet_ntop(AF_INET6, &reinterpret_cast<struct sockaddr_in6 *>(ifa->ifa_addr)->sin6_addr, addr, sizeof(addr));
                }
                iface.ip = addr;
            }
            else if (family == AF_LINK && ifa->ifa_data != nullptr)
            {
                auto *sdl = reinterpret_cast<struct sockaddr_dl *>(ifa->ifa_addr);
                const unsigned char *mac = reinterpret_cast<const unsigned char *>(LLADDR(sdl));
                if (sdl->sdl_alen > 0)
                {
                    std::ostringstream macStream;
                    macStream << std::uppercase << std::hex << std::setfill('0');
                    for (int i = 0; i < sdl->sdl_alen; ++i)
                    {
                        if (i > 0)
                            macStream << ":";
                        macStream << std::setw(2) << static_cast<unsigned int>(mac[i]);
                    }
                    iface.mac = macStream.str();
                }
            }

            if (ifa->ifa_data != nullptr)
            {
                auto *data = reinterpret_cast<struct if_data *>(ifa->ifa_data);
                iface.rxBytes = data->ifi_ibytes;
                iface.txBytes = data->ifi_obytes;
                iface.rxSpeed = 0;
                iface.txSpeed = 0;
            }
        }

        freeifaddrs(ifaddr);

        for (const auto &pair : ifaceMap)
        {
            interfaces.push_back(pair.second);
        }
#endif

        {
            std::lock_guard<std::mutex> guard(statsMutex);
            for (auto &iface : interfaces)
            {
                auto it = previousStats.find(iface.name);
                if (it != previousStats.end())
                {
                    const auto elapsedMs = std::chrono::duration_cast<std::chrono::milliseconds>(now - it->second.timestamp).count();
                    if (elapsedMs > 0)
                    {
                        const double elapsedSeconds = static_cast<double>(elapsedMs) / 1000.0;
                        const unsigned long long rxDiff = iface.rxBytes >= it->second.rxBytes ? iface.rxBytes - it->second.rxBytes : 0;
                        const unsigned long long txDiff = iface.txBytes >= it->second.txBytes ? iface.txBytes - it->second.txBytes : 0;
                        iface.rxSpeed = static_cast<unsigned long long>(rxDiff / elapsedSeconds);
                        iface.txSpeed = static_cast<unsigned long long>(txDiff / elapsedSeconds);
                    }
                }

                previousStats[iface.name] = {iface.rxBytes, iface.txBytes, now};
            }
        }

        return interfaces;
    }

} // namespace epm
