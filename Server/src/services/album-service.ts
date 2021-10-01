//--------------------------------------------------------------------------
// Imports Section:
//--------------------------------------------------------------------------
import { Observable }     from "rxjs/Observable";
import { MySQLService }   from "./mysql-service";
import { CheckParams }    from 'runtime-type-checks';

//--------------------------------------------------------------------------
// No Typings Available:
//--------------------------------------------------------------------------
var sync     = require('synchronize');

//--------------------------------------------
// Models:
//--------------------------------------------
import { Photo } from "../models/photo";


//--------------------------------------------------------------------------
// AlbumService Class:
//--------------------------------------------------------------------------
export class AlbumService
{
    //----------------------------------------------------------------------
    // Public Methods Section:
    //----------------------------------------------------------------------
    public getAlbums() : Observable<any>
    {
        return Observable.create(observer => {
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
               connection.query("call getAlbums", (err, rows) => {
                   if (err)
                   {
                       mySQLService.stop(connection);
                       console.log(err);
                       observer.error(err);
                   }
                   else
                   {
                       let result: any = rows[0];
                       mySQLService.stop(connection);
                       observer.next(result);
                       observer.complete();
                   }
               });
            },
            (error) => {
                console.log(error);
                observer.error(error);
            });
        });
    }

    //----------------------------------------------------------------------
    @CheckParams()
    public getAlbum(albumId: number) : Observable<any>
    {
        return Observable.create(observer => {
            if (isNaN(albumId))
            {
                albumId = 0;
            }
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
               connection.query("call getAlbum(" + albumId + ")", (err, rows) => {
                   if (err)
                   {
                       mySQLService.stop(connection);
                       console.log(err);
                       observer.error(err);
                   }
                   else
                   {
                       let result: any = rows[0];
                       mySQLService.stop(connection);
                       observer.next(result);
                       observer.complete();
                   }
               });
            },
            (error) => {
                console.log(error);
                observer.error(error);
            });
        });
    }

    //----------------------------------------------------------------------
    @CheckParams()
    public getAlbumPictures(albumId: number) : Observable<any>
    {
        return Observable.create(observer => {
            if (isNaN(albumId))
            {
                albumId = 0;
            }
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
               connection.query("call getAlbumPictures(" + albumId + ")", (err, rows) => {
                   if (err)
                   {
                       mySQLService.stop(connection);
                       console.log(err);
                       observer.error(err);
                   }
                   else
                   {
                       let result: any = rows;
                       mySQLService.stop(connection);
                       observer.next(result);
                       observer.complete();
                   }
               });
            },
            (error) => {
                console.log(error);
                observer.error(error);
            });
        });
    }

    //----------------------------------------------------------------------
    @CheckParams()
    public setAlbumPictures(albumId: number, photos: Photo[]) : Observable<any>
    {
        return Observable.create(observer => {
            if (isNaN(albumId))
            {
                albumId = 0;
            }
            let mySQLService = new MySQLService();
            mySQLService.start().subscribe((connection) => {
               connection.query("call removeAlbumPicturesFor(" + albumId + ")", (err, rows) => {
                   if (err)
                   {
                       mySQLService.stop(connection);
                       console.log(err);
                       observer.error(err);
                   }
                   else
                   {
                        sync(connection, "query");
                        sync.fiber(() => {
                            
                            let photoCounter : number = 0;
                            let rawPhoto: any;
                            let photo : Photo;

                            for (photoCounter = 0; photoCounter < photos.length; photoCounter++)
                            {
                                photo = photos[photoCounter];

                                if (
                                    albumId && 
                                    photo.title &&
                                    photo.description &&
                                    photo.src &&
                                    photo.kind
                                )
                                {
                                  let sSQL = "call insertAlbumPicture(" +   
                                        albumId + ", " +
                                        "\"" + photo.title + "\"" + ", " +
                                        "\"" + photo.description + "\"" + ", " +
                                        "\"" + photo.src + "\"" + ", " +
                                        "\"" + photo.kind + "\""  +
                                    ")";
    
                                    let qDocuments = sync.await(connection.query(sSQL, sync.defer() ));
                                }
  
                            }

                            mySQLService.stop(connection);
                            observer.next(true);
                            observer.complete();

                        });
                   }
               });
            },
            (error) => {
                console.log(error);
                observer.error(error);
            });
        });
    }
}