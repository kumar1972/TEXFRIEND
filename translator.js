function translateColorToTamil(colorName) {
    if (!colorName) return '-';
    var original = colorName.trim();
    var c = original.toLowerCase();

    // 📌 All Color Mappings Dictionary
    var map = {
        'gold': 'கோல்டு',
        'l. olive': 'L. ஆலிவ்',
        'd. olive': 'D. ஆலிவ்',
        'grey': 'கிரே',
        'gray': 'கிரே',
        't.salavai': 'T. சலவை',
        't. salavai': 'T. சலவை',
        't. white': 'T. சலவை',
        '1/2 salavai': '1/2 சலவை',
        '1/2 white': '1/2 சலவை',
        'white': 'வெள்ளை',
        'black': 'கருப்பு',
        'blue': 'ப்ளூ',
        'yellow': 'மஞ்சள்',
        'red': 'ரெட்',
        'green': 'கிரீன்',
        'p. green': 'கிளி பச்சை',
        'brown': 'பிரவுன்',
        'khaki': 'காக்கி',
        'l. khaki': 'L. காக்கி',
        'd. khaki': 'D. காக்கி',
        'rose': 'ரோஸ்',
        'orange': 'ஆரஞ்சு',
        'violet': 'வைலட்',
        'pink': 'பிங்க்',
        'navy': 'நேவி',
        'l. navy': 'L. நேவி',
        'd. navy': 'D. நேவி',
        'maroon': 'மெரூன்',
        'olive': 'ஆலிவ்',
        'l. blue': 'L. ப்ளூ',
        'r. blue': 'R. ப்ளூ',
        'turq': 'டர்க்',
        'purple': 'பர்புள்',
        'cream': 'கிரீம்',
        'beige': 'பேஜ்',
        'biscuit': 'பிஸ்கட்',
        'majenda': 'மெஜந்தா'
    };

    if (map[c]) {
        return map[c];
    }

    let translated = original;
    translated = translated.replace(/^t\.\s*/i, 'T. ');
    translated = translated.replace(/^l\.\s*/i, 'L. ');
    translated = translated.replace(/^d\.\s*/i, 'D. ');
    translated = translated.replace(/^r\.\s*/i, 'R. ');
    translated = translated.replace(/^p\.\s*/i, 'P. ');
    
    translated = translated.replace(/gold/gi, 'கோல்டு')
                           .replace(/grey/gi, 'கிரே')
                           .replace(/gray/gi, 'கிரே')
                           .replace(/salavai/gi, 'சலவை')
                           .replace(/white/gi, 'வெள்ளை')
                           .replace(/black/gi, 'கருப்பு')
                           .replace(/blue/gi, 'ப்ளூ')
                           .replace(/yellow/gi, 'மஞ்சள்')
                           .replace(/red/gi, 'ரெட்')
                           .replace(/green/gi, 'கிரீன்')
                           .replace(/brown/gi, 'பிரவுன்')
                           .replace(/khaki/gi, 'காக்கி')
                           .replace(/rose/gi, 'ரோஸ்')
                           .replace(/orange/gi, 'ஆரஞ்சு')
                           .replace(/pink/gi, 'பிங்க்')
                           .replace(/maroon/gi, 'மெரூன்')
                           .replace(/olive/gi, 'ஆலிவ்')
                           .replace(/purple/gi, 'பர்புள்')
                           .replace(/cream/gi, 'கிரீம்')
                           .replace(/beige/gi, 'பேஜ்')
                           .replace(/biscuit/gi, 'பிஸ்கட்')
                           .replace(/majenda/gi, 'மெஜந்தா')
                           .replace(/navy/gi, 'நேவி');

    return translated;
}
