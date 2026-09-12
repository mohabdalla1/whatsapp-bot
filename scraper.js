const axios = require('axios');

async function findLeadsWithoutWebsite(city = "Khartoum", category = "amenity=restaurant") {
    try {
        console.log(`🔍 جاري البحث عن ${category} في مدينة ${city}...`);
        
        const query = `
            [out:json];
            area[name="${city}"]->.searchArea;
            (
              node["${category.split('=')[0]}"="${category.split('=')[1]}"](area.searchArea);
            );
            out body;
        `;
        
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        const response = await axios.get(url);
        const elements = response.data.elements || [];

        const qualifiedLeads = elements.filter(item => {
            const tags = item.tags || {};
            const hasPhone = tags.phone || tags['contact:phone'] || tags['mobile'];
            const hasWebsite = tags.website || tags['contact:website'];
            
            return hasPhone && !hasWebsite;
        }).map(item => ({
            name: item.tags.name || "منشأة تجارية",
            phone: item.tags.phone || item.tags['contact:phone'] || item.tags['mobile'],
            category: category.split('=')[1],
            city: city
        }));

        console.log(`🎯 تم إيجاد ${qualifiedLeads.length} عميل مستهدف!`);
        return qualifiedLeads;
    } catch (error) {
        console.error("❌ خطأ أثناء جلب البيانات:", error.message);
        return [];
    }
}

module.exports = { findLeadsWithoutWebsite };
