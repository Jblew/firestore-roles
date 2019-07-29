
export function ow_catch(fn: () => void): boolean | string {
    try {
        fn();
        return true;
    } catch (error) {
        return error + "";
    }
}
