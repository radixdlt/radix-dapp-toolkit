use scrypto::prelude::*;

#[derive(NonFungibleData, ScryptoSbor)]
struct StaffBadge {
    employee_name: String,
}

#[blueprint]
mod gumball_machine {
    struct GumballMachine {
        gumballs: Vault,
        gumballs_resource_manager: ResourceManager,
        collected_xrd: Vault,
        price: Decimal,
        staff_badge_address: ResourceAddress,
        staff_badge_resource_manager: ResourceManager,
    }

    impl GumballMachine {
        // given a price in XRD, creates a ready-to-use gumball machine
        pub fn instantiate(
            price: Decimal,
            flavor: String,
            dapp: String,
        ) -> (ComponentAddress, Bucket) {
            let admin_badge: Bucket = ResourceBuilder::new_fungible()
                .divisibility(DIVISIBILITY_NONE)
                .metadata("name", "admin badge")
                .metadata("dapp_definition", &dapp)
                .mint_initial_supply(1);

            let staff_badge: ResourceManager =
                ResourceBuilder::new_uuid_non_fungible::<StaffBadge>()
                    .metadata("name", "staff_badge")
                    .metadata("dapp_definition", &dapp)
                    .mintable(rule!(require(admin_badge.resource_address())), LOCKED)
                    .recallable(rule!(require(admin_badge.resource_address())), LOCKED)
                    .burnable(rule!(require(admin_badge.resource_address())), LOCKED)
                    .create_with_no_initial_supply();

            // create a new Gumball resource, with a fixed quantity of 100
            let gumballs_resource_manager: ResourceManager = ResourceBuilder::new_fungible()
                .metadata("name", "Gumball")
                .metadata("symbol", flavor)
                .metadata("description", "A delicious gumball")
                .metadata("dapp_definition", &dapp)
                .updateable_metadata(
                    rule!(
                        require(admin_badge.resource_address())
                            || require(staff_badge.resource_address())
                    ),
                    LOCKED,
                )
                .mintable(
                    rule!(
                        require(admin_badge.resource_address())
                            || require(staff_badge.resource_address())
                    ),
                    LOCKED,
                )
                .create_with_no_initial_supply();

            let bucket_of_gumballs = admin_badge.authorize(|| gumballs_resource_manager.mint(100));

            // populate a GumballMachine struct and instantiate a new component
            let component = Self {
                gumballs_resource_manager: gumballs_resource_manager,
                gumballs: Vault::with_bucket(bucket_of_gumballs),
                collected_xrd: Vault::new(RADIX_TOKEN),
                price: price,
                staff_badge_address: staff_badge.resource_address(),
                staff_badge_resource_manager: staff_badge,
            }
            .instantiate()
            .metadata("dapp_definition", dapp.to_owned())
            .metadata("name", "Gumball Machine".to_owned())
            .metadata("description", "Sandbox Gumball Machine just for you to play around!".to_owned())
            .metadata("icon_url", "https://img.freepik.com/free-vector/bubble-gum-realistic-composition-with-ball-shaped-vending-machine-with-colorful-gumballs_1284-64158.jpg?w=1000".to_owned())
            .authority_rule("get_price", rule!(allow_all), LOCKED)
            .authority_rule("buy_gumball", rule!(allow_all), LOCKED)
            .authority_rule(
                "set_price",
                rule!(
                    require(admin_badge.resource_address())
                        || require(staff_badge.resource_address())
                ),
                LOCKED,
            )
            .authority_rule(
                "withdraw_earnings",
                rule!(require(admin_badge.resource_address())),
                LOCKED,
            )
            .authority_rule(
                "mint_staff_badge",
                rule!(require(admin_badge.resource_address())),
                LOCKED,
            )
            .authority_rule(
                "refill_gumball_machine",
                rule!(
                    require(admin_badge.resource_address())
                        || require(staff_badge.resource_address())
                ),
                LOCKED,
            )
            .globalize();

            (component.component_address(), admin_badge)
        }

        pub fn get_price(&self) -> Decimal {
            self.price
        }

        pub fn set_price(&mut self, price: Decimal) {
            self.price = price
        }

        pub fn mint_staff_badge(&mut self, employee_name: String) -> Bucket {
            let staff_badge_bucket: Bucket = self
                .staff_badge_resource_manager
                .mint_uuid_non_fungible(StaffBadge {
                    employee_name: employee_name,
                });
            staff_badge_bucket
        }

        pub fn recall_staff_badge() {
            // recall a staff nft badge and burn it.
        }

        pub fn refill_gumball_machine(&mut self) {
            // mint some more gumball tokens requires an admin or staff badge
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
