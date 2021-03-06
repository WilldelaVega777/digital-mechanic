//--------------------------------------------------------------------------------------------------
// Imports Section:
//--------------------------------------------------------------------------------------------------
//----------------------------------
// Models:
//----------------------------------
import { Navigation } from "../models/navigation";
import { Link }       from "../models/link";


//--------------------------------------------------------------------------------------------------
// Service Class:
//--------------------------------------------------------------------------------------------------
export class NavigationService
{
    //----------------------------------------------------------------------------------------------
    // Constructor Method Section:
    //----------------------------------------------------------------------------------------------
    constructor() {}

    //----------------------------------------------------------------------
    // Public Methods Section:
    //----------------------------------------------------------------------
    public getNavigation() : Navigation
    {
        let links : Link[] = [
            new Link("/nav1", "Opcion 1"), new Link("/nav2", "Opcion 2")
        ];
        return new Navigation(links);
    }

}