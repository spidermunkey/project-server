module.exports.Color = function(name,hex) {

    // let from = indexName;

    let rgb = hexToRgb(hex);
    if (rgb == 'invalid hex') return 0;
    let hsl = rgbToHsl(...rgb);

    let [ hue,
            saturation,
                lightness ] = hsl;

    this.name = name;
    this.rgb = rgb;
    this.hex = hex;
    this.hsl = hsl;
    this.primaryColor = getRange(hue);
    this.primaryTone = greyscale(lightness,saturation)[0];

    [ this.hue,
        this.saturation,
            this.lightness ] = [ hue, saturation , lightness ];

    [ this.red,
        this.green,
            this.blue ] = rgb;

            this.varations = {
                tint: {
                    t100: `color-mix(in srgb, ${this.hex} 5%, white 95%)`,
                    t200: `color-mix(in srgb, ${this.hex} 15%, white 85%)`,
                    t300: `color-mix(in srgb, ${this.hex} 25%, white 75%)`,
                    t400: `color-mix(in srgb, ${this.hex} 35%, white 65%)`,
                    t500: `color-mix(in srgb, ${this.hex} 45%, white 55%)`,
                    t600: `color-mix(in srgb, ${this.hex} 55%, white 45%)`,
                    t700: `color-mix(in srgb, ${this.hex} 65%, white 35%)`,
                    t800: `color-mix(in srgb, ${this.hex} 75%, white 25%)`,
                    t900: `color-mix(in srgb, ${this.hex} 85%, white 15%)`,
                    t1k: `color-mix(in srgb, ${this.hex} 95%, white 5%)`,
                },
                shade: {
                    s100: `color-mix(in srgb, ${this.hex} 5%,  black 95%)`,
                    s200: `color-mix(in srgb, ${this.hex} 15%,  black 85%)`,
                    s300: `color-mix(in srgb, ${this.hex} 25%,  black 75%)`,
                    s400: `color-mix(in srgb, ${this.hex} 35%,  black 65%)`,
                    s500: `color-mix(in srgb, ${this.hex} 45%,  black 55%)`,
                    s600: `color-mix(in srgb, ${this.hex} 55%,  black 45%)`,
                    s700: `color-mix(in srgb, ${this.hex} 65%,  black 35%)`,
                    s800: `color-mix(in srgb, ${this.hex} 75%,  black 25%)`,
                    s900: `color-mix(in srgb, ${this.hex} 85%,  black 15%)`,
                    s1k: `color-mix(in srgb, ${this.hex} 95%,  black 5%)`,
                },
            }
}

class Color {
    constructor(title,hex) {
        this.title = title;
        this.hex = hex;
    
        this.element = document.createElement('div');
    
            this.element.classList.add('view-panel--clr');
            this.element.style.backgroundColor = hex;
            this.element.dataset.clr = hex;
            this.element.dataset.ttl = title;
        
        this.varations = {
            tint: {
                t100: `color-mix(in srgb, ${this.hex} 5%, white 95%)`,
                t200: `color-mix(in srgb, ${this.hex} 15%, white 85%)`,
                t300: `color-mix(in srgb, ${this.hex} 25%, white 75%)`,
                t400: `color-mix(in srgb, ${this.hex} 35%, white 65%)`,
                t500: `color-mix(in srgb, ${this.hex} 45%, white 55%)`,
                t600: `color-mix(in srgb, ${this.hex} 55%, white 45%)`,
                t700: `color-mix(in srgb, ${this.hex} 65%, white 35%)`,
                t800: `color-mix(in srgb, ${this.hex} 75%, white 25%)`,
                t900: `color-mix(in srgb, ${this.hex} 85%, white 15%)`,
                t1k: `color-mix(in srgb, ${this.hex} 95%, white 5%)`,
            },
            shade: {
                s100: `color-mix(in srgb, ${this.hex} 5%,  black 95%)`,
                s200: `color-mix(in srgb, ${this.hex} 15%,  black 85%)`,
                s300: `color-mix(in srgb, ${this.hex} 25%,  black 75%)`,
                s400: `color-mix(in srgb, ${this.hex} 35%,  black 65%)`,
                s500: `color-mix(in srgb, ${this.hex} 45%,  black 55%)`,
                s600: `color-mix(in srgb, ${this.hex} 55%,  black 45%)`,
                s700: `color-mix(in srgb, ${this.hex} 65%,  black 35%)`,
                s800: `color-mix(in srgb, ${this.hex} 75%,  black 25%)`,
                s900: `color-mix(in srgb, ${this.hex} 85%,  black 15%)`,
                s1k: `color-mix(in srgb, ${this.hex} 95%,  black 5%)`,
            },
            gradients: {
                // background: rgb(2,0,36);
                // background: linear-gradient(113deg, rgba(2,0,36,1) 0%, rgba(9,9,121,1) 35%, rgba(0,212,255,1) 100%)
            }
        }
    }

    createTint(pct) {
        
    }
}

function mapCollection(name) {
    const model = mongoose.model(name, Icon, name)
    console.log('creating model for', name, model)
    return model
}


function greyscale(lightness,saturation) {
    /*  README
        SD[#] 'STANDARD DEVIATION' A RANGE CATCHING ANY COLORS THERIN
        S[#] 'SATURATION'
        L[#] 'LIGHTNESS'

        [[MOODY COLORS]]
        
        Earth Tones are defined as colors low in lightness and saturation
        L[45] - S[72] -- {SD[45] IF L[30] - S[45]}

        Jewel Tones are defined as colors low in lightness high in saturation
        L[50] - S[45+]

        
        [[BRIGHT COLORS]]
        
        Neon tones are high in saturation with a centered lightness
            L[45-50] - S[99+]
        Luminous tones are high in saturation and high in lightness
            L[75] - S[90+]
        Vivid tones are high in saturation with a lightness above 50% and below vivid thresholds of 70%
            L[45-50] - S[50-70]
    
        [[FLAT COLORS]]
        
        Pastel tones take a high lightness threshold starting from 70% and 
        any saturation that isn't gray within a 60% deviation
            L[70+] S[25+] -- {SD[60] IF L[90+]}
        
        Muted tones like pastel take a high lightness threshold just under pastel 
        but are muted by a lack of saturation spaning accross a 45%-60% threshold
            L[65-70] -- {SD[60-45]}

        Clean colors represent a catch all for flat colors with an average saturation and lightness
            L[45+] - S[32-70]
        
    */ 
    let deviation = lightness - saturation;
    let result = ['no dice', false];
    // when lightness is between 90 and 10 and saturation is less than 5

    // [grey,white,black]
    if ((saturation <= 6)){
        if (lightness <= 10) {
            return result = ['black',false];
        }
        if (lightness >= 90) {
            return result = ['white',false];
        }
        return result = ['grey',true];
    }
    
    // when lightness is more than 45
    // [pastel,bright,muted]
    if (lightness > 45 && lightness <= 99 && saturation > 5) {
        if (deviation <= 60 && deviation > -5) {
            // grey catch
            if (deviation <= 60 && deviation > 56) {
                // its greyish
                return result = ['washed',true];
            }
        }
        // grey catch
        if (deviation > 62) {
            // light grey
            return result = ['grey',true]
        }
        // pastel catch
        if (lightness >= 65 && saturation > 10) {
            if (lightness >= 65  && lightness <= 80 && (deviation < 0))
                return result = ['clean',false]
            return result = ['pastel',false]
        }
        // bright catch
        if (lightness < 70 && lightness >= 45 && saturation >= 45) {
            if (saturation >= 99 && lightness >= 45 && lightness <= 55)
                return result = ['neon', false]
            if (saturation >= 90 && lightness >= 70)
                return result = ['luminous', false];
            if (saturation > 80 && lightness >= 45 && lightness < 70) 
                return result = ['vivid', false];
            // if (saturation < 80 && saturation > 70 && lightness > 40 && lightness < 70)
            //     return result = ['vivid2',false];
        }
        // clean colors
        if (saturation > 32 && lightness > 45)
            return result = ['clean',false]
        // muted colors
        if (lightness <= 65 && saturation < 70 && (deviation < 60 || saturation < 45))
            return result = ['muted',false]
        }

    // when lightness is less than 50
    // [earth,jewel]
    if (lightness <= 50 && lightness >= 10 && saturation > 5) {
        if (saturation <= 72 && lightness <= 45)
            return result = ['earth',false];
        if (saturation >= 45)
            return result = ['jewel',false];


        if (deviation < 45 && deviation > 0 && saturation < 45 && lightness < 30) {
            // its an [earth,washed,muted] tone
            return result = ['earth',false];
        }
        if (deviation <= 0) {
            return result = ['jewel', false]
        }
        return result = ['grey',true];
        // its mid/natural grey
    }
    
    // last call for pastel
    if (lightness > 90 && lightness < 99) { 
        if (deviation <= 60) {
            return result = ['pastel',false];
        }
        return result = ['grey',true];
    }

    return result;
}

function getRange(hue) {
    let bucket;
    let rangeFinder = [
        [0,15,'red'],
        [15,45,'orange'],
        [45,60,'yellow'],
        [60,180,'green'],
        [180,240,'blue'],
        [240,300,'purple'],
        [300,360,'rose'],
    ]

    for (let i = 0; i < rangeFinder.length; i++) {
        if (hue >= rangeFinder[i][0] && hue <= rangeFinder[i][1]) {
            bucket = rangeFinder[i][2];
            break
        }
    }

    return bucket;
}


function rgbToHsl (r,g,b) 
{
    let red = r / 255;
    let green = g / 255;
    let blue = b / 255;

    let colorMax = Math.max(red,green,blue);
    let colorMin = Math.min(red,green,blue);

    let delta = colorMax - colorMin;
    let midrange = (colorMax + colorMin) / 2;
    
    // midrange 
        // lightness is the average of the largest and smallest color components
    function getLightness() {
        let l = (colorMax + colorMin) / 2;
        return Math.round(l * 100);
    }

    // range
    // saturation is simply the chroma scaled to fill
    // the interval [0, 1] for every combination of hue and lightness
    function getSaturation() {
        let s = delta / (1 - Math.abs(2 * midrange - 1));
        return  Math.round(s * 100);
    }

    // https://stackoverflow.com/questions/39118528/rgb-to-hsl-conversion
    function getHue() {
        let h;
        let differenceOverDelta = subtractOverDelta(delta);

        if (delta === 0) {
            h = 0;
        }

        if (colorMax === red) {
            h = (differenceOverDelta(green,blue) + (g < b ? 6 : 0));
        }
        if (colorMax === green) {
            h = (differenceOverDelta(blue,red) + 2);
        }
        if (colorMax === blue) {
            h = (differenceOverDelta(red,green) + 4);
        }

        return Math.round(h * 60);
    }

    function subtractOverDelta(delta) {
        return function(expression1,expression2) {
            return ((expression1 - expression2) / delta);
        }
    }

    let lightness = getLightness();
    let saturation = getSaturation();
    let hue = getHue();

    return [hue,saturation,lightness];
}

function toBase16(base10) 
{
    if (base10 === 0) {
        return '00';
    }
    if (base10 > 255) {
        return 'TooHigh';
    }
    if (!Number.isInteger(base10)) {
        console.log('NAN!');
        return parseInt(base10).toString(16)
    }
    return base10.toString(16);
}

// HEX CONVERSIONS
function hexToRgb(hex) 
{
    let a = hex.replace('#','');
    let b = a.split('');
    let c = b.length;

    return c === 3 ? convertThreeDigitHex(b) :
            c === 6 ? convertSixDigitHex(a) :
            'invalid hex';
            // console.log(new Error(`${hex} is not a valid hex`));
}
function toBase10(base16) 
{
    if (base16.toString().length > 2) {
        return 'too many digits for css'
    }

    return parseInt(base16,16);
}

function repeatThenConvertBase10(base16) 
{
    return toBase10(base16.repeat(2))
}

function convertThreeDigitHex(arrOfThree) // [f,f,f] => [ff,ff,ff]
{
    let values = arrOfThree.map(repeatThenConvertBase10);
    return values;
}

function convertSixDigitHex(sixDigitHex)  // #ffffff => [ff,ff,ff]
{
    let values = sixDigitHex
            .split(/(..)/g)
                .filter(s => s)
                    .map(toBase10);
    return values
}
