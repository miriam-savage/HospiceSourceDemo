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

    static isEmptyList(list: any[]): boolean {
        // tslint:disable-next-line:triple-equals
        if (list == undefined) return true;
        // tslint:disable-next-line:triple-equals
        if (list == null) return true;
        if (!Array.isArray(list)) return true;
        // tslint:disable-next-line:triple-equals
        if (list.length == 0) return true;
        return false;
    }

    static sortByString(items: any[], field: string, ascending?: boolean): any[] {
        const asc = Utils.isEmpty(ascending) ? true : ascending;
        if (Utils.isEmptyList(items)) { return items; }
        // tslint:disable-next-line:only-arrow-functions
        items.sort(function(a, b) {
            const nameA = a[field].toUpperCase();
            const nameB = b[field].toUpperCase();
            if (asc) {
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                return 0;
            } else {
                if (nameA > nameB) {
                    return -1;
                }
                if (nameA < nameB) {
                    return 1;
                }
                return 0;
            }

        });
        return items;
    }
}