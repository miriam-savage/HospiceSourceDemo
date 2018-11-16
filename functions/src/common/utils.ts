export class Utils {
    static isEmpty(item: any): boolean {
        if (item === 'undefined') return true;
        if (item === undefined) return true;
        if (item === null) return true;
        if (item === '') return true;
        if (typeof item === 'object') {
            if (Object.keys(item).length === 0) return true;
        }
        return false;
    }
}