use scrypto::prelude::*;

#[blueprint]
mod gumball_machine {
    enable_method_auth! {
        roles {
            admin => updatable_by: [SELF, OWNER];
        },
        methods {
            get_price => PUBLIC;
            buy_gumball => PUBLIC;
            set_price => restrict_to: [admin, OWNER];
            withdraw_earnings => restrict_to: [admin, OWNER];
            refill_gumball_machine => restrict_to: [admin, OWNER];
        }
    }

    struct GumballMachine {
        gumballs: Vault,
        gumballs_resource_manager: ResourceManager,
        collected_xrd: Vault,
        price: Decimal,
    }

    impl GumballMachine {
        pub fn instantiate(
            price: Decimal,
            flavor: String,
            icon_url: String,
        ) -> (ComponentAddress, Bucket) {
            let (reservation, component_address) =
                Runtime::allocate_component_address(GumballMachine::blueprint_id());

            let non_fungible_global_id = NonFungibleGlobalId::package_of_direct_caller_badge(
                GumballMachine::blueprint_id().package_address,
            );
            let account: Global<Account> = Blueprint::<Account>::create_advanced(
                OwnerRole::Fixed(rule!(require(non_fungible_global_id))),
                None::<GlobalAddressReservation>,
            );

            let admin_badge: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {
                    init {
                        "name" => vec![flavor.to_owned(), "admin badge".to_owned()].join(" "), locked;
                        "description" => "Admin badge for Sandbox Gumball Machine".to_owned(), locked;
                        "icon_url" => UncheckedUrl(icon_url.to_owned()), locked;
                        "dapp_definitions" => vec![GlobalAddress::from(account.address())], locked;
                    }
                })
                .mint_initial_supply(10).into();

            // create a new Gumball resource, with a fixed quantity of 100
            let gumballs_resource_manager: ResourceManager =
                ResourceBuilder::new_fungible(OwnerRole::None)
                    .metadata(metadata! {
                        init {
                            "name" => vec![flavor.to_owned(), "Gumball".to_owned()].join(" "), locked;
                            "tags" => vec!["gumball".to_owned(), flavor.to_owned(), "sandbox".to_owned(), "testing".to_owned()], locked;
                            "symbol" => flavor.to_owned(), locked;
                            "info_url" => UncheckedUrl("https://www.radixdlt.com".to_owned()), locked;
                            "icon_url" => UncheckedUrl(icon_url.to_owned()), locked;
                            "description" => "A delicious gumball".to_owned(), locked;
                            "dapp_definitions" => vec![GlobalAddress::from(account.address())], locked;
                        }
                    })
                    .mint_roles(mint_roles! {
                        minter => rule!(require(admin_badge.resource_address()));
                        minter_updater => rule!(require(admin_badge.resource_address()));
                    })
                    .create_with_no_initial_supply();

            let bucket_of_gumballs =
                admin_badge.authorize_with_all(|| gumballs_resource_manager.mint(100));

            // populate a GumballMachine struct and instantiate a new component
            let component = Self {
                gumballs_resource_manager: gumballs_resource_manager,
                gumballs: Vault::with_bucket(bucket_of_gumballs),
                collected_xrd: Vault::new(XRD),
                price: price,
            }
            .instantiate()
            .prepare_to_globalize(OwnerRole::Fixed(rule!(require(
                admin_badge.resource_address()
            ))))
            .roles(roles! {
                admin => rule!(require(admin_badge.resource_address()));
            })
            .metadata(metadata! {
                init {
                    "name" => "Gumball Machine Component Name".to_owned(), locked;
                    "description" => "Gumball Machine Component Description".to_owned(), locked;
                    "dapp_definition" => GlobalAddress::from(account.address()), locked;
                }
            })
            .with_address(reservation)
            .globalize();

            account.set_metadata(
                "icon_url", 
                UncheckedUrl("https://img.freepik.com/free-vector/bubble-gum-realistic-composition-with-ball-shaped-vending-machine-with-colorful-gumballs_1284-64158.jpg?w=1000".to_owned())
            );

            account.set_metadata(
                "claimed_entities",
                vec![
                    GlobalAddress::from(component_address),
                    GlobalAddress::from(admin_badge.resource_address()),
                    GlobalAddress::from(gumballs_resource_manager.address()),
                ],
            );

            account.set_metadata(
                "tags",
                vec![
                    "gumball".to_owned(),
                    flavor.to_owned(),
                    "sandbox".to_owned(),
                    "dApp".to_owned(),
                    "testing".to_owned(),
                ],
            );

            account.set_metadata("name", "Gumball Machine".to_owned());
            account.set_metadata(
                "description",
                "Sandbox Gumball Machine just for you to play around!".to_owned(),
            );
            account.set_metadata("account_type", "dapp definition".to_owned());

            (component.address(), admin_badge)
        }

        pub fn get_price(&self) -> Decimal {
            self.price
        }

        pub fn set_price(&mut self, price: Decimal) {
            self.price = price
        }

        pub fn refill_gumball_machine(&mut self) {
            // mint some more gumball tokens requires an admin badge
            self.gumballs.put(self.gumballs_resource_manager.mint(100));
        }

        pub fn buy_gumball(&mut self, mut payment: Bucket) -> (Bucket, Bucket) {
            // take our price in XRD out of the payment
            // if the caller has sent too few, or sent something other than XRD, they'll get a runtime error
            let our_share = payment.take(self.price);
            self.collected_xrd.put(our_share);

            // we could have simplified the above into a single line, like so:
            // self.collected_xrd.put(payment.take(self.price));

            // return a tuple containing a gumball, plus whatever change is left on the input payment (if any)
            // if we're out of gumballs to give, we'll see a runtime error when we try to grab one
            (self.gumballs.take(1), payment)
        }

        pub fn withdraw_earnings(&mut self) -> Bucket {
            self.collected_xrd.take_all()
        }
    }
}
