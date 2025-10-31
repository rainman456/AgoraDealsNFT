/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/discount_platform.json`.
 */
export type DiscountPlatform = {
  "address": "9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3",
  "metadata": {
    "name": "discountPlatform",
    "version": "1.0.0",
    "spec": "0.1.0",
    "description": "Web3-powered discount marketplace with NFT coupons"
  },
  "instructions": [
    {
      "name": "addComment",
      "discriminator": [
        59,
        175,
        193,
        236,
        134,
        214,
        75,
        141
      ],
      "accounts": [
        {
          "name": "comment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "promotion"
              }
            ]
          }
        },
        {
          "name": "promotion"
        },
        {
          "name": "merchant"
        },
        {
          "name": "userStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "content",
          "type": "string"
        },
        {
          "name": "parentComment",
          "type": {
            "option": "pubkey"
          }
        }
      ]
    },
    {
      "name": "autoAwardBadge",
      "discriminator": [
        142,
        251,
        216,
        167,
        62,
        45,
        205,
        180
      ],
      "accounts": [
        {
          "name": "badgeNft",
          "writable": true
        },
        {
          "name": "userStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user"
        },
        {
          "name": "mint",
          "writable": true,
          "signer": true
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "masterEdition",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "tokenMetadataProgram",
          "address": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
        },
        {
          "name": "sysvarInstructions",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "badgeType",
          "type": {
            "defined": {
              "name": "badgeType"
            }
          }
        }
      ]
    },
    {
      "name": "buyDutchAuction",
      "discriminator": [
        61,
        177,
        198,
        161,
        36,
        102,
        221,
        200
      ],
      "accounts": [
        {
          "name": "auction",
          "writable": true
        },
        {
          "name": "coupon",
          "writable": true
        },
        {
          "name": "marketplace"
        },
        {
          "name": "seller",
          "writable": true
        },
        {
          "name": "marketplaceAuthority",
          "writable": true
        },
        {
          "name": "userStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "buyListing",
      "discriminator": [
        115,
        149,
        42,
        108,
        44,
        49,
        140,
        153
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true
        },
        {
          "name": "coupon",
          "writable": true
        },
        {
          "name": "marketplace"
        },
        {
          "name": "seller",
          "writable": true
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "marketplaceAuthority",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "cancelAuction",
      "discriminator": [
        156,
        43,
        197,
        110,
        218,
        105,
        143,
        182
      ],
      "accounts": [
        {
          "name": "auction",
          "writable": true
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "cancelListing",
      "discriminator": [
        41,
        183,
        50,
        232,
        230,
        233,
        157,
        70
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true
        },
        {
          "name": "seller",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "cancelRedemptionTicket",
      "discriminator": [
        222,
        100,
        219,
        91,
        40,
        96,
        114,
        132
      ],
      "accounts": [
        {
          "name": "ticket",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "claimRewards",
      "discriminator": [
        4,
        144,
        132,
        71,
        116,
        23,
        151,
        80
      ],
      "accounts": [
        {
          "name": "stakeAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "stake_account.coupon",
                "account": "stakeAccount"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "stakingPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  105,
                  110,
                  103,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "nftMint"
        },
        {
          "name": "stakeVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "nftMint"
              }
            ]
          }
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "rewardPool",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createAuction",
      "discriminator": [
        234,
        6,
        201,
        246,
        47,
        219,
        176,
        107
      ],
      "accounts": [
        {
          "name": "auction",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "coupon"
              },
              {
                "kind": "arg",
                "path": "auctionId"
              }
            ]
          }
        },
        {
          "name": "coupon"
        },
        {
          "name": "userStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "auctionId",
          "type": "u64"
        },
        {
          "name": "auctionType",
          "type": {
            "defined": {
              "name": "auctionType"
            }
          }
        },
        {
          "name": "startingPrice",
          "type": "u64"
        },
        {
          "name": "reservePrice",
          "type": "u64"
        },
        {
          "name": "durationSeconds",
          "type": "i64"
        },
        {
          "name": "autoExtend",
          "type": "bool"
        },
        {
          "name": "minBidIncrement",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createGroupDeal",
      "discriminator": [
        224,
        6,
        90,
        198,
        152,
        131,
        64,
        180
      ],
      "accounts": [
        {
          "name": "groupDeal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  100,
                  101,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "promotion"
              },
              {
                "kind": "arg",
                "path": "dealId"
              }
            ]
          }
        },
        {
          "name": "escrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "groupDeal"
              }
            ]
          }
        },
        {
          "name": "promotion"
        },
        {
          "name": "merchant"
        },
        {
          "name": "organizer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "dealId",
          "type": "u64"
        },
        {
          "name": "targetParticipants",
          "type": "u32"
        },
        {
          "name": "maxParticipants",
          "type": "u32"
        },
        {
          "name": "basePrice",
          "type": "u64"
        },
        {
          "name": "discountTiers",
          "type": {
            "vec": {
              "defined": {
                "name": "discountTier"
              }
            }
          }
        },
        {
          "name": "durationSeconds",
          "type": "i64"
        }
      ]
    },
    {
      "name": "createPromotion",
      "discriminator": [
        165,
        11,
        98,
        141,
        245,
        78,
        115,
        127
      ],
      "accounts": [
        {
          "name": "promotion",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  109,
                  111,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "merchant"
              },
              {
                "kind": "account",
                "path": "merchant.total_coupons_created",
                "account": "merchant"
              }
            ]
          }
        },
        {
          "name": "merchant",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "discountPercentage",
          "type": "u8"
        },
        {
          "name": "maxSupply",
          "type": "u32"
        },
        {
          "name": "expiryTimestamp",
          "type": "i64"
        },
        {
          "name": "category",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "price",
          "type": "u64"
        }
      ]
    },
    {
      "name": "finalizeAuction",
      "discriminator": [
        220,
        209,
        175,
        193,
        57,
        132,
        241,
        168
      ],
      "accounts": [
        {
          "name": "auction",
          "writable": true
        },
        {
          "name": "coupon",
          "writable": true
        },
        {
          "name": "marketplace"
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "auction"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true
        },
        {
          "name": "winner",
          "writable": true
        },
        {
          "name": "marketplaceAuthority",
          "writable": true
        },
        {
          "name": "winnerStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "winner"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "finalizeGroupDeal",
      "discriminator": [
        92,
        214,
        22,
        247,
        179,
        218,
        217,
        253
      ],
      "accounts": [
        {
          "name": "groupDeal",
          "writable": true
        },
        {
          "name": "promotion",
          "writable": true
        },
        {
          "name": "merchant",
          "writable": true
        },
        {
          "name": "marketplace",
          "writable": true
        },
        {
          "name": "escrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "groupDeal"
              }
            ]
          }
        },
        {
          "name": "merchantAuthority",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "generateRedemptionTicket",
      "discriminator": [
        20,
        118,
        197,
        161,
        99,
        59,
        158,
        102
      ],
      "accounts": [
        {
          "name": "ticket",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  99,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "coupon"
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "coupon"
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u64"
        },
        {
          "name": "latitude",
          "type": {
            "option": "f64"
          }
        },
        {
          "name": "longitude",
          "type": {
            "option": "f64"
          }
        }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "marketplace",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116,
                  112,
                  108,
                  97,
                  99,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeStaking",
      "discriminator": [
        184,
        41,
        251,
        154,
        146,
        145,
        197,
        77
      ],
      "accounts": [
        {
          "name": "stakingPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  105,
                  110,
                  103,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "rewardRatePerDay",
          "type": "u64"
        },
        {
          "name": "minStakeDuration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "joinGroupDeal",
      "discriminator": [
        37,
        179,
        229,
        69,
        250,
        197,
        155,
        17
      ],
      "accounts": [
        {
          "name": "participant",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  114,
                  116,
                  105,
                  99,
                  105,
                  112,
                  97,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "groupDeal"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "groupDeal",
          "writable": true
        },
        {
          "name": "escrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "groupDeal"
              }
            ]
          }
        },
        {
          "name": "userStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "likeComment",
      "discriminator": [
        129,
        249,
        45,
        219,
        85,
        221,
        49,
        38
      ],
      "accounts": [
        {
          "name": "commentLike",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  101,
                  110,
                  116,
                  95,
                  108,
                  105,
                  107,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "comment"
              }
            ]
          }
        },
        {
          "name": "comment",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "listForSale",
      "discriminator": [
        188,
        214,
        1,
        112,
        93,
        215,
        124,
        207
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "coupon"
              }
            ]
          }
        },
        {
          "name": "coupon"
        },
        {
          "name": "userStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "price",
          "type": "u64"
        }
      ]
    },
    {
      "name": "mintBadge",
      "discriminator": [
        242,
        234,
        237,
        183,
        232,
        245,
        146,
        1
      ],
      "accounts": [
        {
          "name": "badgeNft",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true,
          "signer": true
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "masterEdition",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "tokenMetadataProgram"
        },
        {
          "name": "sysvarInstructions",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "badgeType",
          "type": {
            "defined": {
              "name": "badgeType"
            }
          }
        }
      ]
    },
    {
      "name": "mintCoupon",
      "discriminator": [
        190,
        110,
        73,
        138,
        8,
        160,
        244,
        63
      ],
      "accounts": [
        {
          "name": "coupon",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  117,
                  112,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "promotion"
              },
              {
                "kind": "account",
                "path": "promotion.current_supply",
                "account": "promotion"
              }
            ]
          }
        },
        {
          "name": "nftMint",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "recipient"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "nftMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "masterEdition",
          "writable": true
        },
        {
          "name": "promotion",
          "writable": true
        },
        {
          "name": "merchant",
          "writable": true
        },
        {
          "name": "marketplace",
          "writable": true
        },
        {
          "name": "recipient"
        },
        {
          "name": "userStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "recipient"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenMetadataProgram"
        },
        {
          "name": "sysvarInstructions",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "couponId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "mintGroupCoupon",
      "discriminator": [
        243,
        118,
        67,
        65,
        128,
        254,
        105,
        45
      ],
      "accounts": [
        {
          "name": "coupon",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  99,
                  111,
                  117,
                  112,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "groupDeal"
              },
              {
                "kind": "account",
                "path": "participant.user",
                "account": "groupParticipant"
              }
            ]
          }
        },
        {
          "name": "groupDeal"
        },
        {
          "name": "participant",
          "writable": true
        },
        {
          "name": "promotion"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "couponId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "placeBid",
      "discriminator": [
        238,
        77,
        148,
        91,
        200,
        151,
        92,
        146
      ],
      "accounts": [
        {
          "name": "bid",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  105,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "auction"
              },
              {
                "kind": "account",
                "path": "bidder"
              },
              {
                "kind": "account",
                "path": "auction.bid_count",
                "account": "couponAuction"
              }
            ]
          }
        },
        {
          "name": "auction",
          "writable": true
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "auction"
              }
            ]
          }
        },
        {
          "name": "previousBidder",
          "writable": true
        },
        {
          "name": "userStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "bidder"
              }
            ]
          }
        },
        {
          "name": "bidder",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "bidAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "ratePromotion",
      "discriminator": [
        112,
        114,
        13,
        124,
        71,
        134,
        72,
        156
      ],
      "accounts": [
        {
          "name": "rating",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  97,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "promotion"
              }
            ]
          }
        },
        {
          "name": "promotion"
        },
        {
          "name": "userStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "stars",
          "type": "u8"
        }
      ]
    },
    {
      "name": "redeemCoupon",
      "discriminator": [
        66,
        181,
        163,
        197,
        244,
        189,
        153,
        0
      ],
      "accounts": [
        {
          "name": "coupon",
          "writable": true
        },
        {
          "name": "nftMint",
          "writable": true
        },
        {
          "name": "tokenAccount",
          "writable": true
        },
        {
          "name": "merchant",
          "writable": true
        },
        {
          "name": "userStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "merchantAuthority",
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "refundGroupDeal",
      "discriminator": [
        197,
        172,
        6,
        56,
        10,
        105,
        1,
        130
      ],
      "accounts": [
        {
          "name": "groupDeal",
          "writable": true
        },
        {
          "name": "participant",
          "writable": true
        },
        {
          "name": "escrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "groupDeal"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "registerMerchant",
      "discriminator": [
        238,
        245,
        77,
        132,
        161,
        88,
        216,
        248
      ],
      "accounts": [
        {
          "name": "merchant",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  114,
                  99,
                  104,
                  97,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "marketplace",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "category",
          "type": "string"
        },
        {
          "name": "latitude",
          "type": {
            "option": "f64"
          }
        },
        {
          "name": "longitude",
          "type": {
            "option": "f64"
          }
        }
      ]
    },
    {
      "name": "stakeCoupon",
      "discriminator": [
        71,
        4,
        167,
        79,
        221,
        84,
        213,
        156
      ],
      "accounts": [
        {
          "name": "stakeAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "coupon"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "stakingPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  105,
                  110,
                  103,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "coupon",
          "writable": true
        },
        {
          "name": "nftMint"
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "stakeVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "nftMint"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "durationDays",
          "type": "u64"
        }
      ]
    },
    {
      "name": "transferCoupon",
      "discriminator": [
        144,
        38,
        18,
        1,
        196,
        64,
        73,
        74
      ],
      "accounts": [
        {
          "name": "coupon",
          "writable": true
        },
        {
          "name": "newOwner"
        },
        {
          "name": "fromAuthority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "updateExternalDeal",
      "discriminator": [
        218,
        142,
        159,
        101,
        126,
        111,
        151,
        27
      ],
      "accounts": [
        {
          "name": "externalDeal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  101,
                  114,
                  110,
                  97,
                  108,
                  95,
                  100,
                  101,
                  97,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "externalId"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "externalId",
          "type": "string"
        },
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "originalPrice",
          "type": "u64"
        },
        {
          "name": "discountedPrice",
          "type": "u64"
        },
        {
          "name": "category",
          "type": "string"
        },
        {
          "name": "imageUrl",
          "type": "string"
        },
        {
          "name": "affiliateUrl",
          "type": "string"
        },
        {
          "name": "expiryTimestamp",
          "type": "i64"
        }
      ]
    },
    {
      "name": "verifyAndRedeemTicket",
      "discriminator": [
        4,
        231,
        211,
        144,
        127,
        73,
        60,
        15
      ],
      "accounts": [
        {
          "name": "ticket",
          "writable": true
        },
        {
          "name": "coupon",
          "writable": true
        },
        {
          "name": "nftMint",
          "writable": true
        },
        {
          "name": "tokenAccount",
          "writable": true
        },
        {
          "name": "merchant",
          "writable": true
        },
        {
          "name": "userStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "ticket.user",
                "account": "redemptionTicket"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "merchantAuthority",
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "expectedHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "badgeNft",
      "discriminator": [
        241,
        237,
        124,
        145,
        201,
        125,
        9,
        228
      ]
    },
    {
      "name": "bid",
      "discriminator": [
        143,
        246,
        48,
        245,
        42,
        145,
        180,
        88
      ]
    },
    {
      "name": "comment",
      "discriminator": [
        150,
        135,
        96,
        244,
        55,
        199,
        50,
        65
      ]
    },
    {
      "name": "commentLike",
      "discriminator": [
        221,
        8,
        40,
        37,
        98,
        193,
        74,
        224
      ]
    },
    {
      "name": "coupon",
      "discriminator": [
        24,
        230,
        224,
        210,
        200,
        206,
        79,
        57
      ]
    },
    {
      "name": "couponAuction",
      "discriminator": [
        14,
        103,
        197,
        53,
        109,
        113,
        243,
        17
      ]
    },
    {
      "name": "externalDeal",
      "discriminator": [
        185,
        162,
        54,
        98,
        125,
        135,
        18,
        40
      ]
    },
    {
      "name": "groupDeal",
      "discriminator": [
        251,
        18,
        233,
        197,
        54,
        139,
        183,
        133
      ]
    },
    {
      "name": "groupParticipant",
      "discriminator": [
        219,
        23,
        9,
        69,
        193,
        219,
        76,
        73
      ]
    },
    {
      "name": "listing",
      "discriminator": [
        218,
        32,
        50,
        73,
        43,
        134,
        26,
        58
      ]
    },
    {
      "name": "marketplace",
      "discriminator": [
        70,
        222,
        41,
        62,
        78,
        3,
        32,
        174
      ]
    },
    {
      "name": "merchant",
      "discriminator": [
        71,
        235,
        30,
        40,
        231,
        21,
        32,
        64
      ]
    },
    {
      "name": "promotion",
      "discriminator": [
        32,
        59,
        115,
        212,
        100,
        17,
        137,
        59
      ]
    },
    {
      "name": "rating",
      "discriminator": [
        203,
        130,
        231,
        178,
        120,
        130,
        70,
        17
      ]
    },
    {
      "name": "redemptionTicket",
      "discriminator": [
        134,
        239,
        22,
        113,
        25,
        135,
        201,
        241
      ]
    },
    {
      "name": "stakeAccount",
      "discriminator": [
        80,
        158,
        67,
        124,
        50,
        189,
        192,
        255
      ]
    },
    {
      "name": "stakingPool",
      "discriminator": [
        203,
        19,
        214,
        220,
        220,
        154,
        24,
        102
      ]
    },
    {
      "name": "userStats",
      "discriminator": [
        176,
        223,
        136,
        27,
        122,
        79,
        32,
        227
      ]
    }
  ],
  "events": [
    {
      "name": "auctionCancelled",
      "discriminator": [
        22,
        32,
        51,
        83,
        215,
        194,
        171,
        209
      ]
    },
    {
      "name": "auctionCreated",
      "discriminator": [
        133,
        190,
        194,
        65,
        172,
        0,
        70,
        178
      ]
    },
    {
      "name": "auctionFinalized",
      "discriminator": [
        136,
        160,
        117,
        237,
        77,
        211,
        136,
        28
      ]
    },
    {
      "name": "badgeEarned",
      "discriminator": [
        225,
        182,
        190,
        32,
        34,
        212,
        200,
        93
      ]
    },
    {
      "name": "bidPlaced",
      "discriminator": [
        135,
        53,
        176,
        83,
        193,
        69,
        108,
        61
      ]
    },
    {
      "name": "commentAdded",
      "discriminator": [
        18,
        240,
        225,
        131,
        42,
        132,
        33,
        44
      ]
    },
    {
      "name": "commentLiked",
      "discriminator": [
        17,
        248,
        234,
        191,
        239,
        66,
        17,
        231
      ]
    },
    {
      "name": "couponListed",
      "discriminator": [
        97,
        85,
        98,
        144,
        181,
        103,
        12,
        66
      ]
    },
    {
      "name": "couponMinted",
      "discriminator": [
        54,
        185,
        253,
        75,
        64,
        7,
        149,
        3
      ]
    },
    {
      "name": "couponRedeemed",
      "discriminator": [
        123,
        241,
        185,
        217,
        117,
        208,
        200,
        89
      ]
    },
    {
      "name": "couponSold",
      "discriminator": [
        245,
        210,
        117,
        5,
        91,
        232,
        148,
        23
      ]
    },
    {
      "name": "couponTransferred",
      "discriminator": [
        77,
        240,
        123,
        57,
        82,
        224,
        32,
        246
      ]
    },
    {
      "name": "externalDealUpdated",
      "discriminator": [
        194,
        197,
        216,
        240,
        74,
        154,
        2,
        7
      ]
    },
    {
      "name": "groupDealCreated",
      "discriminator": [
        183,
        37,
        173,
        20,
        41,
        38,
        80,
        67
      ]
    },
    {
      "name": "groupDealFinalized",
      "discriminator": [
        161,
        187,
        252,
        163,
        226,
        4,
        234,
        14
      ]
    },
    {
      "name": "groupDealJoined",
      "discriminator": [
        138,
        226,
        185,
        73,
        188,
        232,
        202,
        150
      ]
    },
    {
      "name": "groupDealRefunded",
      "discriminator": [
        60,
        234,
        231,
        97,
        232,
        56,
        246,
        225
      ]
    },
    {
      "name": "listingCancelled",
      "discriminator": [
        11,
        46,
        163,
        10,
        103,
        80,
        139,
        194
      ]
    },
    {
      "name": "marketplaceInitialized",
      "discriminator": [
        22,
        167,
        42,
        34,
        172,
        55,
        155,
        14
      ]
    },
    {
      "name": "merchantRated",
      "discriminator": [
        184,
        191,
        161,
        222,
        26,
        43,
        236,
        153
      ]
    },
    {
      "name": "merchantRegistered",
      "discriminator": [
        202,
        61,
        140,
        95,
        139,
        239,
        17,
        83
      ]
    },
    {
      "name": "promotionCreated",
      "discriminator": [
        147,
        163,
        31,
        31,
        135,
        41,
        143,
        81
      ]
    },
    {
      "name": "promotionRated",
      "discriminator": [
        27,
        155,
        125,
        60,
        145,
        32,
        2,
        25
      ]
    },
    {
      "name": "rewardsClaimed",
      "discriminator": [
        75,
        98,
        88,
        18,
        219,
        112,
        88,
        121
      ]
    },
    {
      "name": "rewardsStaked",
      "discriminator": [
        85,
        8,
        24,
        163,
        22,
        70,
        141,
        6
      ]
    },
    {
      "name": "ticketGenerated",
      "discriminator": [
        205,
        225,
        168,
        122,
        145,
        69,
        243,
        213
      ]
    },
    {
      "name": "ticketRedeemed",
      "discriminator": [
        251,
        171,
        7,
        57,
        152,
        25,
        168,
        38
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "nameTooLong",
      "msg": "Name is too long"
    },
    {
      "code": 6001,
      "name": "categoryTooLong",
      "msg": "Category is too long"
    },
    {
      "code": 6002,
      "name": "descriptionTooLong",
      "msg": "Description is too long"
    },
    {
      "code": 6003,
      "name": "invalidDiscount",
      "msg": "Invalid discount percentage"
    },
    {
      "code": 6004,
      "name": "invalidSupply",
      "msg": "Invalid supply amount"
    },
    {
      "code": 6005,
      "name": "invalidExpiry",
      "msg": "Invalid expiry timestamp"
    },
    {
      "code": 6006,
      "name": "invalidPrice",
      "msg": "Invalid price"
    },
    {
      "code": 6007,
      "name": "promotionInactive",
      "msg": "Promotion is inactive"
    },
    {
      "code": 6008,
      "name": "supplyExhausted",
      "msg": "Supply exhausted"
    },
    {
      "code": 6009,
      "name": "promotionExpired",
      "msg": "Promotion expired"
    },
    {
      "code": 6010,
      "name": "couponAlreadyRedeemed",
      "msg": "Coupon already redeemed"
    },
    {
      "code": 6011,
      "name": "couponExpired",
      "msg": "Coupon expired"
    },
    {
      "code": 6012,
      "name": "notCouponOwner",
      "msg": "Not coupon owner"
    },
    {
      "code": 6013,
      "name": "wrongMerchant",
      "msg": "Wrong merchant"
    },
    {
      "code": 6014,
      "name": "notMerchantAuthority",
      "msg": "Not merchant authority"
    },
    {
      "code": 6015,
      "name": "notMarketplaceAuthority",
      "msg": "Not marketplace authority"
    },
    {
      "code": 6016,
      "name": "listingInactive",
      "msg": "Listing inactive"
    },
    {
      "code": 6017,
      "name": "wrongCoupon",
      "msg": "Wrong coupon"
    },
    {
      "code": 6018,
      "name": "notListingSeller",
      "msg": "Not listing seller"
    },
    {
      "code": 6019,
      "name": "invalidCoordinates",
      "msg": "Invalid coordinates"
    },
    {
      "code": 6020,
      "name": "locationNotSupported",
      "msg": "Location not supported"
    },
    {
      "code": 6021,
      "name": "invalidInput",
      "msg": "Invalid input: string exceeds maximum length"
    }
  ],
  "types": [
    {
      "name": "auctionCancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "reason",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "auctionCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "coupon",
            "type": "pubkey"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "auctionType",
            "type": {
              "defined": {
                "name": "auctionType"
              }
            }
          },
          {
            "name": "startingPrice",
            "type": "u64"
          },
          {
            "name": "reservePrice",
            "type": "u64"
          },
          {
            "name": "endTime",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "auctionFinalized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "winner",
            "type": "pubkey"
          },
          {
            "name": "finalPrice",
            "type": "u64"
          },
          {
            "name": "auctionType",
            "type": {
              "defined": {
                "name": "auctionType"
              }
            }
          },
          {
            "name": "finalizedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "auctionType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "english"
          },
          {
            "name": "dutch"
          },
          {
            "name": "sealedBid"
          }
        ]
      }
    },
    {
      "name": "badgeEarned",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "badgeType",
            "type": {
              "defined": {
                "name": "badgeType"
              }
            }
          },
          {
            "name": "mint",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "badgeNft",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "badgeType",
            "type": {
              "defined": {
                "name": "badgeType"
              }
            }
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "metadata",
            "type": "pubkey"
          },
          {
            "name": "earnedAt",
            "type": "i64"
          },
          {
            "name": "metadataUri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "badgeType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "firstPurchase"
          },
          {
            "name": "tenRedemptions"
          },
          {
            "name": "fiftyRedemptions"
          },
          {
            "name": "topReviewer"
          },
          {
            "name": "earlyAdopter"
          },
          {
            "name": "merchantPartner"
          },
          {
            "name": "communityModerator"
          }
        ]
      }
    },
    {
      "name": "bid",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "bidder",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "isWinning",
            "type": "bool"
          },
          {
            "name": "isRefunded",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "bidPlaced",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auction",
            "type": "pubkey"
          },
          {
            "name": "bidder",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "bidCount",
            "type": "u32"
          },
          {
            "name": "newEndTime",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "comment",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "promotion",
            "type": "pubkey"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "likes",
            "type": "u32"
          },
          {
            "name": "isMerchantReply",
            "type": "bool"
          },
          {
            "name": "parentComment",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "commentAdded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "comment",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "promotion",
            "type": "pubkey"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "isReply",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "commentLike",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "comment",
            "type": "pubkey"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "commentLiked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "comment",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "coupon",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "promotion",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "merchant",
            "type": "pubkey"
          },
          {
            "name": "discountPercentage",
            "type": "u8"
          },
          {
            "name": "expiryTimestamp",
            "type": "i64"
          },
          {
            "name": "isRedeemed",
            "type": "bool"
          },
          {
            "name": "redeemedAt",
            "type": "i64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "metadataUri",
            "type": "string"
          },
          {
            "name": "mint",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "couponAuction",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "coupon",
            "type": "pubkey"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "auctionType",
            "type": {
              "defined": {
                "name": "auctionType"
              }
            }
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "startingPrice",
            "type": "u64"
          },
          {
            "name": "reservePrice",
            "type": "u64"
          },
          {
            "name": "currentBid",
            "type": "u64"
          },
          {
            "name": "highestBidder",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "bidCount",
            "type": "u32"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "isFinalized",
            "type": "bool"
          },
          {
            "name": "autoExtend",
            "type": "bool"
          },
          {
            "name": "extensionSeconds",
            "type": "i64"
          },
          {
            "name": "minBidIncrement",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "couponListed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "listing",
            "type": "pubkey"
          },
          {
            "name": "coupon",
            "type": "pubkey"
          },
          {
            "name": "nftMint",
            "type": "pubkey"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "price",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "couponMinted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "coupon",
            "type": "pubkey"
          },
          {
            "name": "nftMint",
            "type": "pubkey"
          },
          {
            "name": "promotion",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "merchant",
            "type": "pubkey"
          },
          {
            "name": "discountPercentage",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "couponRedeemed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "coupon",
            "type": "pubkey"
          },
          {
            "name": "nftMint",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "merchant",
            "type": "pubkey"
          },
          {
            "name": "discountPercentage",
            "type": "u8"
          },
          {
            "name": "redemptionCode",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "couponSold",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "listing",
            "type": "pubkey"
          },
          {
            "name": "coupon",
            "type": "pubkey"
          },
          {
            "name": "nftMint",
            "type": "pubkey"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "marketplaceFee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "couponTransferred",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "coupon",
            "type": "pubkey"
          },
          {
            "name": "nftMint",
            "type": "pubkey"
          },
          {
            "name": "from",
            "type": "pubkey"
          },
          {
            "name": "to",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "dealSource",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "skyscanner"
          },
          {
            "name": "bookingCom"
          },
          {
            "name": "shopify"
          },
          {
            "name": "amazon"
          },
          {
            "name": "custom"
          }
        ]
      }
    },
    {
      "name": "discountTier",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "minParticipants",
            "type": "u32"
          },
          {
            "name": "discountPercentage",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "externalDeal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oracleAuthority",
            "type": "pubkey"
          },
          {
            "name": "source",
            "type": {
              "defined": {
                "name": "dealSource"
              }
            }
          },
          {
            "name": "externalId",
            "type": "string"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "originalPrice",
            "type": "u64"
          },
          {
            "name": "discountedPrice",
            "type": "u64"
          },
          {
            "name": "discountPercentage",
            "type": "u8"
          },
          {
            "name": "category",
            "type": "string"
          },
          {
            "name": "imageUrl",
            "type": "string"
          },
          {
            "name": "affiliateUrl",
            "type": "string"
          },
          {
            "name": "expiryTimestamp",
            "type": "i64"
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          },
          {
            "name": "isVerified",
            "type": "bool"
          },
          {
            "name": "verificationCount",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "externalDealUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "deal",
            "type": "pubkey"
          },
          {
            "name": "source",
            "type": {
              "defined": {
                "name": "dealSource"
              }
            }
          },
          {
            "name": "externalId",
            "type": "string"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "verified",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "groupDeal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "promotion",
            "type": "pubkey"
          },
          {
            "name": "merchant",
            "type": "pubkey"
          },
          {
            "name": "organizer",
            "type": "pubkey"
          },
          {
            "name": "targetParticipants",
            "type": "u32"
          },
          {
            "name": "currentParticipants",
            "type": "u32"
          },
          {
            "name": "maxParticipants",
            "type": "u32"
          },
          {
            "name": "basePrice",
            "type": "u64"
          },
          {
            "name": "discountTiers",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "discountTier"
                  }
                },
                5
              ]
            }
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "isFinalized",
            "type": "bool"
          },
          {
            "name": "escrowVault",
            "type": "pubkey"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "finalizedAt",
            "type": "i64"
          },
          {
            "name": "totalEscrowed",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "groupDealCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupDeal",
            "type": "pubkey"
          },
          {
            "name": "promotion",
            "type": "pubkey"
          },
          {
            "name": "merchant",
            "type": "pubkey"
          },
          {
            "name": "organizer",
            "type": "pubkey"
          },
          {
            "name": "targetParticipants",
            "type": "u32"
          },
          {
            "name": "basePrice",
            "type": "u64"
          },
          {
            "name": "deadline",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "groupDealFinalized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupDeal",
            "type": "pubkey"
          },
          {
            "name": "participantsCount",
            "type": "u32"
          },
          {
            "name": "finalDiscount",
            "type": "u8"
          },
          {
            "name": "totalRevenue",
            "type": "u64"
          },
          {
            "name": "finalizedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "groupDealJoined",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupDeal",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "participantsCount",
            "type": "u32"
          },
          {
            "name": "amountEscrowed",
            "type": "u64"
          },
          {
            "name": "currentDiscount",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "groupDealRefunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupDeal",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "refundAmount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "groupParticipant",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupDeal",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amountEscrowed",
            "type": "u64"
          },
          {
            "name": "joinedAt",
            "type": "i64"
          },
          {
            "name": "isRefunded",
            "type": "bool"
          },
          {
            "name": "couponMinted",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "listing",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "coupon",
            "type": "pubkey"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "listingCancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "listing",
            "type": "pubkey"
          },
          {
            "name": "coupon",
            "type": "pubkey"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "location",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "latitude",
            "type": "i32"
          },
          {
            "name": "longitude",
            "type": "i32"
          },
          {
            "name": "regionCode",
            "type": "u16"
          },
          {
            "name": "countryCode",
            "type": "u16"
          },
          {
            "name": "cityHash",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "marketplace",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "totalCoupons",
            "type": "u64"
          },
          {
            "name": "totalMerchants",
            "type": "u64"
          },
          {
            "name": "feeBasisPoints",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "marketplaceInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketplace",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "feeBasisPoints",
            "type": "u16"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "merchant",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "category",
            "type": "string"
          },
          {
            "name": "totalCouponsCreated",
            "type": "u64"
          },
          {
            "name": "totalCouponsRedeemed",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "location",
            "type": {
              "defined": {
                "name": "location"
              }
            }
          },
          {
            "name": "hasPhysicalLocation",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "merchantRated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "merchant",
            "type": "pubkey"
          },
          {
            "name": "rater",
            "type": "pubkey"
          },
          {
            "name": "rating",
            "type": "u8"
          },
          {
            "name": "review",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "merchantRegistered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "merchant",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "category",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "promotion",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "merchant",
            "type": "pubkey"
          },
          {
            "name": "discountPercentage",
            "type": "u8"
          },
          {
            "name": "maxSupply",
            "type": "u32"
          },
          {
            "name": "currentSupply",
            "type": "u32"
          },
          {
            "name": "expiryTimestamp",
            "type": "i64"
          },
          {
            "name": "category",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "location",
            "type": {
              "defined": {
                "name": "location"
              }
            }
          },
          {
            "name": "geoCellId",
            "type": "u64"
          },
          {
            "name": "radiusMeters",
            "type": "u32"
          },
          {
            "name": "isLocationBased",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "promotionCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "promotion",
            "type": "pubkey"
          },
          {
            "name": "merchant",
            "type": "pubkey"
          },
          {
            "name": "discountPercentage",
            "type": "u8"
          },
          {
            "name": "maxSupply",
            "type": "u32"
          },
          {
            "name": "expiryTimestamp",
            "type": "i64"
          },
          {
            "name": "price",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "promotionRated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "promotion",
            "type": "pubkey"
          },
          {
            "name": "stars",
            "type": "u8"
          },
          {
            "name": "isUpdate",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "rating",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "promotion",
            "type": "pubkey"
          },
          {
            "name": "merchant",
            "type": "pubkey"
          },
          {
            "name": "stars",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "redemptionLocation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "latitude",
            "type": "i32"
          },
          {
            "name": "longitude",
            "type": "i32"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "redemptionTicket",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "coupon",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "merchant",
            "type": "pubkey"
          },
          {
            "name": "ticketHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "isConsumed",
            "type": "bool"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "redemptionLocation",
            "type": {
              "option": {
                "defined": {
                  "name": "redemptionLocation"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "reputationTier",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "bronze"
          },
          {
            "name": "silver"
          },
          {
            "name": "gold"
          },
          {
            "name": "platinum"
          },
          {
            "name": "diamond"
          }
        ]
      }
    },
    {
      "name": "rewardsClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "staker",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "rewardsStaked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "staker",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "duration",
            "type": "i64"
          },
          {
            "name": "expectedRewards",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "stakeAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "coupon",
            "type": "pubkey"
          },
          {
            "name": "nftMint",
            "type": "pubkey"
          },
          {
            "name": "amountStaked",
            "type": "u64"
          },
          {
            "name": "stakedAt",
            "type": "i64"
          },
          {
            "name": "unlockAt",
            "type": "i64"
          },
          {
            "name": "durationDays",
            "type": "u64"
          },
          {
            "name": "rewardsEarned",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "claimedAt",
            "type": {
              "option": "i64"
            }
          }
        ]
      }
    },
    {
      "name": "stakingPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "totalStaked",
            "type": "u64"
          },
          {
            "name": "totalRewardsDistributed",
            "type": "u64"
          },
          {
            "name": "rewardRatePerDay",
            "type": "u64"
          },
          {
            "name": "minStakeDuration",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "ticketGenerated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "ticket",
            "type": "pubkey"
          },
          {
            "name": "coupon",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "merchant",
            "type": "pubkey"
          },
          {
            "name": "ticketHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "nonce",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "ticketRedeemed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "ticket",
            "type": "pubkey"
          },
          {
            "name": "coupon",
            "type": "pubkey"
          },
          {
            "name": "nftMint",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "merchant",
            "type": "pubkey"
          },
          {
            "name": "redeemedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "userStats",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "totalPurchases",
            "type": "u32"
          },
          {
            "name": "totalRedemptions",
            "type": "u32"
          },
          {
            "name": "totalRatingsGiven",
            "type": "u32"
          },
          {
            "name": "totalComments",
            "type": "u32"
          },
          {
            "name": "totalListings",
            "type": "u32"
          },
          {
            "name": "reputationScore",
            "type": "u64"
          },
          {
            "name": "tier",
            "type": {
              "defined": {
                "name": "reputationTier"
              }
            }
          },
          {
            "name": "badgesEarned",
            "type": "bytes"
          },
          {
            "name": "joinedAt",
            "type": "i64"
          },
          {
            "name": "lastActivity",
            "type": "i64"
          }
        ]
      }
    }
  ]
};

export const IDL: DiscountPlatform = {
  "address": "9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3",
  "metadata": {
    "name": "discountPlatform",
    "version": "1.0.0",
    "spec": "0.1.0",
    "description": "Web3-powered discount marketplace with NFT coupons"
  },
  "instructions": [],
  "accounts": [],
  "types": []
} as any;
