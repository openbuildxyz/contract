module move_startrek::startrek_nft {
    use sui::tx_context::{Self, sender, TxContext};
    use std::string::{utf8, String, Self};
    use sui::transfer;
    use sui::address::{Self};
    use sui::table::{Self, Table};
    use sui::object::{Self, UID};
    use sui::bls12381::bls12381_min_pk_verify;
    use sui::package::{Self};
    use sui::display;


    // --------------- Errors ---------------
    const EInvalidMintSig: u64 = 0;
    const ErrorNFTIDAlreadyMinted: u64 = 1;

    struct AdminCap has key {
        id: UID,
    }

    struct MintCap has key {
        id: UID,
        public_key: vector<u8>,
    }

    struct MintRecord has key {
        id: UID,
        record: Table<String, address>,
    }

    struct StartrekNFT has key, store {
        id: UID,
        token_id: String,
        image_url: String,
        name: String,
        creator: address,
    }

    struct STARTREK_NFT has drop {}

    fun init(otw: STARTREK_NFT, ctx: &mut TxContext) {
        let keys = vector[
            utf8(b"name"),
            utf8(b"link"),
            utf8(b"image_url"),
            utf8(b"description"),
            utf8(b"project_url"),
            utf8(b"creator"),
        ];

        let values = vector[
            utf8(b"{name} #{token_id}"),
            utf8(b"https://openbuild.xyz/"),
            utf8(b"{image_url}"),
            utf8(b"Startrek NFT!"),
            utf8(b"https://openbuild.xyz/"),
            utf8(b"{creator}")
        ];

        let admin = tx_context::sender(ctx);
        let admin_cap = AdminCap { id: object::new(ctx) };
        let publisher = package::claim(otw, ctx);
        let display = display::new_with_fields<StartrekNFT>(
            &publisher, keys, values, ctx
        );
        
        let mint_record = MintRecord { id: object::new(ctx), record: table::new(ctx) };
        transfer::share_object(mint_record);
        display::update_version(&mut display);
        transfer::transfer(admin_cap, admin);
        transfer::public_transfer(publisher, sender(ctx));
        transfer::public_transfer(display, sender(ctx));
    }

    public entry fun create_mint_cap(_: &AdminCap, public_key: vector<u8>, ctx: &mut TxContext){
        transfer::share_object(MintCap {
            id: object::new(ctx),
            public_key,
        });
    }

    #[lint_allow(self_transfer)]
    public entry fun mint(mint_record: &mut MintRecord, mint_cap: &mut MintCap, nft_id: String, image_url: String, bls_sig: vector<u8>, ctx: &mut TxContext)  {
        assert!(!table::contains(&mint_record.record, nft_id), ErrorNFTIDAlreadyMinted);

        let public_key = &mint_cap.public_key;
        let sender = tx_context::sender(ctx);

        let msg_merge = nft_id;
        string::append(&mut msg_merge, image_url);

        let msg_vec = string::bytes(&msg_merge);
        
        assert!(
            bls12381_min_pk_verify(
                &bls_sig, public_key, msg_vec,
            ),
            EInvalidMintSig
        );
        table::add(&mut mint_record.record, nft_id, sender);

        let startrek_NFT = StartrekNFT { id: object::new(ctx),  token_id: nft_id, image_url, name: utf8(b"Startrek"), creator: sender };
        transfer::public_transfer(startrek_NFT, sender);
    }

}