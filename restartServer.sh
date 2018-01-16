pid=ps ax -o pid,args --no-headers| grep wiredforge | head -1 | cut -d ' ' -f 1
sudo kill $pid
cd ~/projects/wiredforge/server
cargo build --release
cp ./target/release/server ../wiredforge
cd ..
./wiredforge