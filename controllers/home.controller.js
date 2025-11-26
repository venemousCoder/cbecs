function getHomePage(req, res) {
    // Hero Slides reflecting the hybrid nature (Retail, Services, Food)
    const heroSlides = [
        { 
            image: "https://placehold.co/800x400/ff5722/ffffff?text=Kano+Mega+Sale", 
            title: "Kano Mega Sale", 
            subtitle: "Discounts on Electronics & Fashion", 
            link: "/category/retail", 
            bg: "#f5f5f5" 
        },
        { 
            image: "https://placehold.co/800x400/232f3e/ffffff?text=Book+Services+Online", 
            title: "Book Services Easily", 
            subtitle: "Salons, Mechanics & Laundry", 
            link: "/category/services", 
            bg: "#e3f2fd" 
        },
        { 
            image: "https://placehold.co/800x400/ffc107/232f3e?text=Order+Food+Now", 
            title: "Hungry?", 
            subtitle: "Order from top Kano Cafés", 
            link: "/category/food", 
            bg: "#fff3e0" 
        }
    ];

    // Sidebar Categories - Mixing Retail, Services, and Food
    const categories = [
        // Retail
        { name: "Supermarket", icon: "fa-shopping-basket", id: "supermarket", type: "retail" },
        { name: "Phones & Tablets", icon: "fa-mobile-alt", id: "phones", type: "retail" },
        { name: "Fashion", icon: "fa-tshirt", id: "fashion", type: "retail" },
        { name: "Electronics", icon: "fa-tv", id: "electronics", type: "retail" },
        // Services
        { name: "Beauty & Salons", icon: "fa-cut", id: "beauty-services", type: "service" },
        { name: "Repairs & Mechanics", icon: "fa-tools", id: "mechanics", type: "service" },
        { name: "Laundry & Cleaning", icon: "fa-soap", id: "laundry", type: "service" },
        // Food
        { name: "Restaurants & Cafés", icon: "fa-utensils", id: "food", type: "food" },
        // More Retail
        { name: "Home & Office", icon: "fa-couch", id: "home", type: "retail" },
        { name: "Computing", icon: "fa-laptop", id: "computing", type: "retail" },
        { name: "Automobile Parts", icon: "fa-car-battery", id: "auto-parts", type: "retail" }
    ];

    // Flash Sales (Primarily Retail Products)
    const flashSales = [
        { name: "Oraimo FreePods 4", price: "18,500", oldPrice: "28,000", discount: "-34%", image: "https://placehold.co/200x200?text=Earbuds", itemsLeft: 12, type: "product" },
        { name: "Nivea Body Lotion", price: "2,500", oldPrice: "4,000", discount: "-37%", image: "https://placehold.co/200x200?text=Lotion", itemsLeft: 50, type: "product" },
        { name: "Men's Casual Sneakers", price: "9,200", oldPrice: "15,000", discount: "-39%", image: "https://placehold.co/200x200?text=Sneakers", itemsLeft: 5, type: "product" },
        { name: "Ace Elec Power Bank", price: "5,000", oldPrice: "9,500", discount: "-47%", image: "https://placehold.co/200x200?text=PowerBank", itemsLeft: 22, type: "product" },
        { name: "Family Pizza Promo", price: "4,500", oldPrice: "6,000", discount: "-25%", image: "https://placehold.co/200x200?text=Pizza", itemsLeft: 10, type: "food" }, // Food item in flash sale
        { name: "Oil Change Service", price: "3,000", oldPrice: "5,000", discount: "-40%", image: "https://placehold.co/200x200?text=Oil+Change", itemsLeft: 8, type: "service" } // Service promo
    ];

    // Mixed Listings (Retail, Service, Food) to show platform versatility
    const listings = [
        { _id: "1", name: "iPhone 13 Pro Max Case", price: "1,500", image: "https://placehold.co/300x300?text=Case", rating: 4.5, sold: "1.2k", type: "product" },
        { _id: "2", name: "Luxury Men's Haircut", price: "2,000", image: "https://placehold.co/300x300?text=Haircut", rating: 4.9, sold: "Bookings: 50+", type: "service", provider: "City Barber" },
        { _id: "3", name: "Jollof Rice & Chicken", price: "1,200", image: "https://placehold.co/300x300?text=Jollof", rating: 4.8, sold: "Orders: 200+", type: "food", provider: "Mama K's Kitchen" },
        { _id: "4", name: "Rechargeable Fan", price: "13,200", image: "https://placehold.co/300x300?text=Fan", rating: 4.8, sold: "500+", type: "product" },
        { _id: "5", name: "Home Cleaning (Standard)", price: "5,000", image: "https://placehold.co/300x300?text=Cleaning", rating: 4.6, sold: "Jobs: 30+", type: "service", provider: "CleanPro Services" },
        { _id: "6", name: "Smartphone Screen Repair", price: "8,000", image: "https://placehold.co/300x300?text=Repair", rating: 4.7, sold: "Jobs: 100+", type: "service", provider: "Tech Fix Kano" },
        { _id: "7", name: "Running Shoes", price: "12,000", image: "https://placehold.co/300x300?text=Shoes", rating: 4.3, sold: "120", type: "product" },
        { _id: "8", name: "Electric Kettle", price: "6,000", image: "https://placehold.co/300x300?text=Kettle", rating: 4.9, sold: "1k+", type: "product" },
        { _id: "9", name: "Beef Burger Combo", price: "2,500", image: "https://placehold.co/300x300?text=Burger", rating: 4.5, sold: "Orders: 450", type: "food", provider: "Grill House" },
        { _id: "10", name: "Generator Mechanic Visit", price: "3,500", image: "https://placehold.co/300x300?text=Mechanic", rating: 4.1, sold: "Jobs: 80", type: "service", provider: "Power Fix" },
        { _id: "11", name: "USB-C Hub", price: "8,000", image: "https://placehold.co/300x300?text=Hub", rating: 4.6, sold: "80", type: "product" },
        { _id: "12", name: "Gaming Headset", price: "10,500", image: "https://placehold.co/300x300?text=Headset", rating: 4.7, sold: "600+", type: "product" }
    ];

    res.render("home", { 
        title: "CBECS | Kano's SME Marketplace for Products & Services",
        categories, 
        heroSlides,
        flashSales,
        listings
    });
}

module.exports = {
    getHomePage
};
