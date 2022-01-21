export type ParsedLine = {
    timestamp: Date
    device: string
    event: string
    reading: string
    value: string | null
    unit: string | null
}

function checkForStringLength<T extends string | null = string>(str: T): string | T {
    if (typeof str === 'string' && str.length > 191) {
        return str.substr(0, 190) + '…';
    }

    return str;
}

export function parseLine (line: string): ParsedLine | null {
    const lineParts = line.trim().split(' ');
    const timestamp = lineParts.shift()?.replace('_', ' ');
    const device = String(lineParts.shift());
    if(timestamp === undefined || device === undefined) {
        return null;
    }

    const date = new Date(timestamp);
    if(isNaN(date.getTime())) {
        return null;
    }

    const event = lineParts.join(' ');
    const eventParts = event.split(':');
    const reading = eventParts.shift() || '';

    const rawValue = eventParts.join(':');
    let value = rawValue || null;
    let unit = null;

    if(value !== null) {
        const number = parseFloat(value);
        if(!isNaN(number)) {
            value = number.toString();
            unit = rawValue.replace(String(number), '').trim() || null;
        }
    }

    return {
        timestamp: date,
        device: checkForStringLength(device),
        event: checkForStringLength(event),
        reading: checkForStringLength(reading),
        value: checkForStringLength(value),
        unit: checkForStringLength(unit)
    };
}