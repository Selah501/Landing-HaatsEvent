const fs = require('fs');

const content = fs.readFileSync('public/events.js', 'utf8');

// A very hacky but effective way to extract the two arrays from the JS file
const productsMatch = content.match(/const globalProducts = (\[[\s\S]*?\]);\s*const eventsData/);
const eventsMatch = content.match(/const eventsData = (\[[\s\S]*?\]);/);

if (productsMatch && eventsMatch) {
    const products = JSON.parse(productsMatch[1]);
    const events = JSON.parse(eventsMatch[1]);
    
    const dbData = {
        products: products,
        events: events
    };
    
    fs.writeFileSync('data.json', JSON.stringify(dbData, null, 2));
    console.log('Successfully created data.json');
} else {
    console.error('Failed to parse events.js');
}
