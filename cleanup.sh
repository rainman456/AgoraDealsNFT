cat <<'EOF' > ~/cleanspace.sh
#!/bin/bash
echo "Before cleanup:"
df -h /

echo "Cleaning cache and build directories..."
rm -rf ~/.rustup ~/.cargo ~/.cache ~/.npm ~/.local/share/Trash ~/.local/state

echo "After cleanup:"
df -h /
EOF

chmod +x ~/cleanspace.sh
