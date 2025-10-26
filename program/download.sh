#!/bin/bash
# Download Metaplex Token Metadata program from mainnet
echo "Downloading Metaplex Token Metadata program..."
solana program dump -u mainnet-beta metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s deps/mpl_token_metadata.so
echo "Download complete!"
