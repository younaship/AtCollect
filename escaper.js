/** エスケープワードが含まれているかチェックします。 */

const ESCAPE_WD = [
    "しね","バカ","ブス","キモ","死ね"
];

exports.chkWd = function(str){
    for(var wd of ESCAPE_WD){
        if(chk(str,wd)) return false;  
    }
    return true;

    function chk(str,wd){
        if(String(str).indexOf(wd) == -1) return false; // No Hit
        else return true;
    }
}