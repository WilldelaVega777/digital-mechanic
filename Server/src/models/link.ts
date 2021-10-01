//--------------------------------------------------------------------------
// Model Class Link:
//--------------------------------------------------------------------------
export class Link
{
    //----------------------------------------------------------------------
    // Private Fields Section:
    //----------------------------------------------------------------------
    private url   : string;
    private text  : string;

    //----------------------------------------------------------------------
    // Constructor Method Section:
    //----------------------------------------------------------------------
    constructor(pUrl: string, pText: string)
    {
        this.url  = pUrl;
        this.text = pText;
    }

    //----------------------------------------------------------------------
    // Public Properties Section:
    //----------------------------------------------------------------------
    public get Url(): string
    {
        return this.url;
    }
    //----------------------------------------------------------------------
    public set Url(value: string)
    {
        this.url = value;
    }

    //----------------------------------------------------------------------
    public get Text(): string
    {
        return this.text;
    }
    //----------------------------------------------------------------------
    public set Text(value: string)
    {
        this.text = value;
    }
}