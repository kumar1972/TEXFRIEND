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
        '1/2 salavai': '1/2 சலவை',
        'white': 'வெள்ளை',
        't. white': 'T. வெள்ளை',
        'black': 'கருப்பு',
        'blue': 'ப்ளூ',
        'yellow': 'மஞ்சள்',
        'red': 'சிகப்பு',
        'green': 'பச்சை',
        'brown': 'பிரவுன்',
        'khaki': 'காக்கி',
        'l. khaki': 'L. காக்கி',
        'd. khaki': 'D. காக்கி',
        'rose': 'ரோஸ்',
        'orange': 'ஆரஞ்சு',
        'violet': 'வயோலெட்',
        'pink': 'பிங்க்',
        'navy': 'நேவி',
        'maroon': 'மெரூன்',
        'olive': 'ஆலிவ்'
    };

    if (map[c]) {
        return map[c];
    }

    let translated = original;
    translated = translated.replace(/^t\.\s*/i, 'T. ');
    translated = translated.replace(/^l\.\s*/i, 'L. ');
    translated = translated.replace(/^d\.\s*/i, 'D. ');
    
    translated = translated.replace(/gold/gi, 'கோல்டு')
                           .replace(/grey/gi, 'கிரே')
                           .replace(/gray/gi, 'கிரே')
                           .replace(/salavai/gi, 'சலவை')
                           .replace(/white/gi, 'வெள்ளை')
                           .replace(/black/gi, 'கருப்பு')
                           .replace(/blue/gi, 'ப்ளூ')
                           .replace(/yellow/gi, 'மஞ்சள்')
                           .replace(/red/gi, 'சிகப்பு')
                           .replace(/green/gi, 'பச்சை')
                           .replace(/brown/gi, 'பிரவுன்')
                           .replace(/khaki/gi, 'காக்கி')
                           .replace(/rose/gi, 'ரோஸ்')
                           .replace(/orange/gi, 'ஆரஞ்சு')
                           .replace(/pink/gi, 'பிங்க்')
                           .replace(/maroon/gi, 'மெரூன்')
                           .replace(/olive/gi, 'ஆலிவ்');

    return translated;
}












