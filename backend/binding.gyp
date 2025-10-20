{
  "targets": [
    {
      "target_name": "system_monitor",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [
        "src/addon.cpp",
        "src/monitor/cpu_monitor.cpp",
        "src/monitor/memory_monitor.cpp",
        "src/monitor/disk_monitor.cpp",
        "src/monitor/network_monitor.cpp",
        "src/models/system_info.cpp",
        "src/controllers/monitor_controller.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "include"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "conditions": [
        [
          "OS=='linux'",
          {
            "libraries": [ "-lpthread" ]
          }
        ],
        [
          "OS=='win'",
          {
            "libraries": [ "Advapi32.lib", "Iphlpapi.lib", "Ws2_32.lib" ]
          }
        ]
      ]
    }
  ]
}
