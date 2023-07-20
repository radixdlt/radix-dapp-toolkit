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
        // given a price in XRD, creates a ready-to-use gumball machine
        pub fn instantiate(
            price: Decimal,
            flavor: String,
            dapp: String,
        ) -> (ComponentAddress, Bucket) {
            let admin_badge: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {
                    init {
                        "name" => "admin badge".to_owned(), locked;
                        "dapp_definition" => dapp.to_owned(), locked;
                    }
                })
                .mint_initial_supply(1);

            // create a new Gumball resource, with a fixed quantity of 100
            let gumballs_resource_manager: ResourceManager =
                ResourceBuilder::new_fungible(OwnerRole::None)
                    .metadata(metadata! {
                        init {
                            "name" => "Gumball".to_owned(), locked;
                            "symbol" => flavor.to_owned(), locked;
                            "description" => "A delicious gumball".to_owned(), locked;
                            "dapp_definition" => dapp.to_owned(), locked;
                        }
                    })
                    .mint_roles(mint_roles! {
                        minter => rule!(require(admin_badge.resource_address()));
                        minter_updater => rule!(require(admin_badge.resource_address()));
                    })
                    // .updateable_metadata( rule!(require(admin_badge.resource_address())), LOCKED)
                    .create_with_no_initial_supply();

            let bucket_of_gumballs = admin_badge.authorize_with_all(|| gumballs_resource_manager.mint(100));
            
            // populate a GumballMachine struct and instantiate a new component
            let component = Self {
                gumballs_resource_manager: gumballs_resource_manager,
                gumballs: Vault::with_bucket(bucket_of_gumballs),
                collected_xrd: Vault::new(RADIX_TOKEN),
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
                    "name" => "Gumball Machine".to_owned(), locked;
                    "description" => "Sandbox Gumball Machine just for you to play around!".to_owned(), locked;
                    "icon_url" => "https://img.freepik.com/free-vector/bubble-gum-realistic-composition-with-ball-shaped-vending-machine-with-colorful-gumballs_1284-64158.jpg?w=1000".to_owned(), locked;
                    "dapp_definition" => dapp.to_owned(), locked;
                }
            })
            .globalize();

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
