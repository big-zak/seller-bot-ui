
import Swal from "sweetalert2"
///import { utils as ethersUtils, BigNumber as BN } from "ethers"
//import ethers from "ethers"
import Status from "./Status"
import Logger from "./Logger"
//import networks from "@/config/networks"
//import appConfig from "@/config/app"
//import Web3Wallets from "./Web3Wallets"
//import Http from "./Http"
//import Cache from "./Cache"
import { format as d3Format } from "d3-format"
import ErrorCodes from "./ErrorCodes"
import URLSlug from 'url-slug'

const $swal = Swal.mixin({
    /*customClass: {
      confirmButton: 'btn btn-primary rounded-pill px-5 shadow-md',
      cancelButton: 'btn btn-danger rounded-pill px-5 shadow-md'
    },
    buttonsStyling: false*/
})
  
 
export default class Utils {

    static zeroAddress = "0x0000000000000000000000000000000000000000";

    static systemErrorMsg = "Something went wrong!"
    //static systemErrorStatus = { type: "error", msg: this.systemErrorMsg }
    
    static systemErrorStatus (errorCode= ErrorCodes.NO_CODE_PROVIDED) {
        return Status.errorPromise(`${this.systemErrorMsg} (ErrorCode: ${errorCode})`)
    }

    static getSwal() {
        return $swal
    }

    static mAlert({ type, title = "", msg = "", explorerUrl="" }) {
    

        if (type == "error" && title.trim() == "") {
            title = "Oops!"
        }
        
        msg = msg.replace(/_/g, " ")
        
        let html = `<div class="text-capitalize">${msg}</div>`

        if (explorerUrl.trim() != "") {
            html += `<div class="py-1 text-success">
                        <a href='${explorerUrl}' target='_blank'>view on explorer</a>
                     </div>`
        }

        let params = {
            title,
            html,
            icon: type
        }

        if (type == "error") {
            params.iconColor = "#EB3398"
        } else if (type == "success") {
            params.iconColor = "#46CBA3"
        }

        $swal.fire(params)
    }

    /**
     * get or set css var
     * @param {*} name 
     * @param {*} value 
     * @returns 
     */
    static cssVar(name,value){
        if(name[0]!='-') name = '--'+name //allow passing with or without --
        if(value) document.documentElement.style.setProperty(name, value)
        return getComputedStyle(document.documentElement).getPropertyValue(name);
    }

    /**
     * copy text to clipboard
     * @param {*} text 
     * @returns 
     */
    static async copyToClipboard(text) {
        try{
            if("clipboard" in navigator){
                await navigator.clipboard.writeText(text);
            }
            else if("execCommand" in document){
                var input = document.createElement('textarea');
                input.innerHTML = text;
                document.body.appendChild(input);
                input.select();
                var result = document.execCommand('copy');
                document.body.removeChild(input);
                return result;
            } else {
                return "failed"
            }

            return "copied"
        } catch(e){
            return "failed"
        }
    }


    /**
     * get accounts eth balance
     * @param {*} walletCore 
     * @param {*} address 
     * @returns 
     */
    static async getEthBalance(walletCore, account) {
        try {

            if(!walletCore || walletCore == null){
                throw new Error("Wallet not connnected")
            }

            let balance = await walletCore.web3Provider.getBalance(account)
            
            if(balance != null) {
                return  this.formatCrypto(this.fromUnits(balance, 18))
            }

            return null;

        } catch (e){
            console.log("Utils#getEthBalance", e, e.stack)
            return null;
        }
    } //end a
    

    /*/ to big number
    static toBN(_val){
        return  BN.from(_val)
    }*/

    /**
     * parse Units
     * @param {*} _value 
     * @param {*} _uint 
     * @returns 
     *
    static parseUnits(_value, _uint){
        return ethersUtils.parseUnits(_value.toString(), _uint)
    }*/

    /**
     * parse Ether
     * @param {*} _value 
     * @returns 
     *
    static parseEther(_value) {
        return  ethersUtils.parseEther(_value)
    }*/

    /**
     * format fiat money
     * @param {*} _val 
     * @returns 
     */
    static formatFiatMoney(_val) {
        return this.formatMoney(_val); //.toLocaleString()
    }

    /**
     * format money
     * @param {*} _val 
     * @param {*} currency 
     * @returns 
     */
    static formatMoney(_val, currency = "USD") {

        if(!_val || _val == null) return "";

        let decPoints = 2;

        if(_val.toString().startsWith("0")){
            decPoints = 4;
        }

        //let fixedVal = Number(_val).toFixed(decPoints) //.toLocaleString()

        let formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            maximumFractionDigits: decPoints,
          });
          
        let fomatedVal =  formatter.format(parseFloat(_val));

        /*if(enableShort && fixedVal >= 1000) {
            return this.toShortNumber(fixedVal)
        }*/

        return fomatedVal;
    }


    static formatNumber(_val) {
       return (new Intl.NumberFormat('en-US')).format(_val)
    }

    /**
     * formatCrypto
     * @param {*} _val 
     * @returns 
     */
    static formatCrypto(_val) {

        let decPoints = 4;

        if(_val.toString().startsWith("0")){
            decPoints = 8;
        }

        return Number(_val).toFixed(decPoints).toString()
    }

    /**
     * decimal exponent
     * @param {*} decimals 
     * @returns 
     *
    static getDecimalsExponent(decimals){
        return this.toBN("10").pow(this.toBN(decimals.toString()))
    } */
    
    /**
     * fromUnits
     * @param {*} _value 
     * @param {*} _units 
     * @returns 
     *
    static fromUnits(_value, _units){
        return ethersUtils.formatUnits(_value.toString(), _units)
    }*/

    static convertUnit(_value, fromUnit, toUnit) {
        return this.parseUnits(this.fromUnits(_value, fromUnit), toUnit);
    }

    /**
     * get token icon name
     * @param {*} symbol 
     * @returns 
     */
    static getTokenIconName(symbol) {
        
        if(!symbol){
            return "";
        }
       //console.log("symbol", symbol)

        symbol = symbol.toLowerCase().replace(/(\_|\-)testnet/ig,"")

        if(["hardhat", "ropsten", "rinkeby","kovan", "local"].includes(symbol)){
            symbol = "eth"
        } else if(symbol == "bsc" || symbol == "tbnb"){
            symbol = "bnb"
        }

        //console.log("symbol====>", symbol)

        return symbol;
    }

    /**
     * get token preview
     * @param {*} symbol 
     * @returns 
     */
    static getTokenPreview(symbol) {
        symbol = this.getTokenIconName(symbol)
        return `/images/cryptos/${symbol.toLowerCase()}.svg`
    }
    


    static maskAddress(address, firstLen=6, lastLen=4) {
        return (address.substring(0, firstLen)+"..."+address.substr((address.length - lastLen), lastLen))
    }

    /**
     * is valid address regex
     */
    static isValidAddressRegex(address) {
        address = (address || "").trim()
        if(address.length == 0) return false;
        return (/^0x[a-fA-F0-9]{40}$/g.test(address))
    }

    /**
     * noty
     * @param {*} param0 
     * @returns 
     */
    static noty({type,msg,  message, ttl = 5_000}) {
        
        let text = msg || message || ""

        if(text == "SYSTEM_BUSY") {
            text = this.generalErrorMsg;
        }

        text = text.replace(/[\-_]+/ig, " ")

        text = text.toLowerCase()
  
        let progressClass =   (type == 'error') ? "bg-soft-danger" : "bg-soft-"+type;

        let _toast = $swal.fire({
            icon: type,
            title: text,
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: ttl,
            //background: this.getCssVar("bs-light"),
            //color: this.getCssVar("bs-dark"),
            customClass: {
                popup: "toast-main",
                timerProgressBar: progressClass
            },
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener('mouseenter', Swal.stopTimer)
              toast.addEventListener('mouseleave', Swal.resumeTimer)
              toast.addEventListener("click", ()=> _toast.close())
            }
          })

        return _toast;
    }

    static notyError = (msg) => this.noty({type: "error", msg})

    static notySuccess = (msg) => this.noty({type: "success", msg})

    // count occurance
    static countOccurance(mainStr, substr) {
        return mainStr.split(substr).length - 1;
    }

    static isEthAddress(address) {
        address = (address || "").trim()
        if(address.length == 0) return false;
        return (/^0x[a-fA-F0-9]{40}$/g.test(address))
    }

    static async getContracts(chainId) {

        // finally lets get the domain chain 
        let contracts = (await import(`../config/contracts/${chainId}.json`)).default;

        return contracts
    }

  
    /**
     * log error
     */
    static logError(msg, err) {
        Logger.log(msg, err)
    }

    static loadingModal (title, text, ttl=300_000, canclose=true) {

        //if(!ttl || ttl <= 0) ttl = 1440 * 1000;

        let htmlContent = `
            <div class="loading-modal">
                <div class="mb-4">${text}</div>
                <div class="d-flex justify-center pb-5">
                    <div class="loader loader-sm"></div>
                </div>
            </div>
        `;

        $swal.fire({
            title,
            html: htmlContent,
            timer: ttl,
            timerProgressBar: true,
            allowOutsideClick: false, 
            allowEscapeKey: false,
            showCloseButton: canclose,
            showConfirmButton: canclose,
            confirmButtonText: "Close"
        })

        return {
            close: () => $swal.close()
        }
    }

    /**
     * getProfileUrl
     */
    static getProfileUrl(domain, webHost) {
        let labelsPart = domain.substring(0, domain.lastIndexOf("."))
        return `https://${labelsPart}.${webHost}`
    }

    static range (start, end) {
        let list = [];
        for (let i = start; i <= end; i++) {
            list.push(i);
        }
        return list
    }

   
    static toShortNumber(value){
        if(value <= 999.9) return value
        return d3Format("~s")(value)
    }

    /**
    * parseUrl
    */
    static parseURL(url) {

        let parser = document.createElement('a');
        parser.href = url

        let host = parser.hostname.toLowerCase()
        let hostSplit = host.split(".")
        
        if(hostSplit.length > 2) {
            parser.name = hostSplit[hostSplit.length - 2]
        } else if(hostSplit.length == 2) {
            parser.name = hostSplit[1]
        } else {
            parser.name = hostSplit[0]
        }

        //parser.name = this.capitalize(parser.name)
        return parser;
    }

    /*static secureRandomUUID() {
        if (!('randomUUID' in crypto)){
            crypto.randomUUID = () => {
                return (
                [1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,
                c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                );
            };
        }

        return crypto.randomUUID()
    }*/
    

    static getCurrencySymbol(code) {
        let currencyInfo = CurrencyCodes[code.toUpperCase()] || null
        if(currencyInfo == null) return code
        return currencyInfo.symbol
    }

    static urlSlug(str=""){
        return URLSlug(str.toLowerCase())
    }

    static isValidAddress(address) {
        
        address = address.trim()

        if(address.length == 0) return false;

        return (/^0x[a-fA-F0-9]{40}$/g.test(address))
    }

    static maskAddress(address, firstLen=6, lastLen=4) {
        return (address.substring(0, firstLen)+"..."+address.substr((address.length - lastLen), lastLen))
    }
}