cmd_Release/xxhash.node := ln -f "Release/obj.target/xxhash.node" "Release/xxhash.node" 2>/dev/null || (rm -rf "Release/xxhash.node" && cp -af "Release/obj.target/xxhash.node" "Release/xxhash.node")
