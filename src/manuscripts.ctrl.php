<?php
include_once 'show_errors.incl';
include_once 'manuscripts.model.php';
include_once 'AjaxResponse.class.php';
include_once 'cls_common.class.php';

class ctrl_manuscripts extends cls_common_ctrl
{
    /*
     * views on manuscripts - top level:
     * 1) default
     * groups
     *  -> manuscripts of one group
     *      ->  records of one manuscript
     * 
     * 2) places of origin
     *  -> ... 
     * 3) all manuscripts
     * 
     */
    
    /* top level routes - returning whole page, not just list-box with data */
    
    /**
     * #[route(/manuscripts),route(/manuscripts/collections)] 
     */
    public static function page_by_collections()
    {
        /* default view:collections of manuscripts */
        $table= mod_manuscripts::get_collections_ex(
                [
                    "instant_exp"=>false,
                    "get_mns_fn"=>"api/manuscripts/collection/{id}"
                ]
        );
        self::include_template($table);
    }
    
    /**
     * #[route(/manuscripts/places)]
     */
    public static function page_by_place_of_origin()
    {
        /* by places of origin*/
        $table= mod_manuscripts::get_places_of_origin_ex(
                ["instant_exp"=>false,
                 "get_mns_fn"=>"api/manuscripts/place/{place}"]);
        self::include_template($table);
    }
    
     /**
     * #[route(/manuscripts/all)]
     */
    public static function page_all_manuscripts()
    {
        $table= mod_manuscripts::get_manuscripts_ex(
                ["instant_exp"=>false,
                 "get_records_fn"=>"api/manuscripts/{signature}/records"]
                );
        self::include_template($table);
    }
    
    
    /*
     * API routes: giving only <list-box> or <detail-box> with desired data
     */
    
    /**
    * #[route(/api/manuscripts/collection/{collection_id})]
    */
    public static function api_collection($collection_id)
    {
        /*listing one specific collection*/
        $rv= mod_manuscripts::get_manuscripts_ex(
                ["instant_exp"=>false,
                 "id"=>$collection_id,
                 "get_records_fn"=>"api/manuscripts/{signature}/records"]
                );
        
        //$rv="<list-box name='lst_manuscripts'>$table</list-box>";
        echo $rv;
    }
    
    /**
    * #[route(/api/manuscripts/place/{place})]
    */
    public static function api_manuscripts_by_place($place)
    {
        $place= urldecode($place);
        $rv= mod_manuscripts::get_manuscripts_ex(
                ["instant_exp"=>false,
                 "places"=>"'".$place."'",
                 "get_records_fn"=>"api/manuscripts/{signature}/records"
                ]
        );
        echo $rv;
    }
    
    /**
    * #[route(/api/manuscripts/{signature}/records)]
    */
    public static function api_records($signature)
    {
        $signature= urldecode($signature);
        $rv= mod_manuscripts::get_records_ex(
                [
                    "signature"=>$signature
                ]
        );
        
        //$rv="<list-box name='lst_mnsRecords'>$table</list-box>";
        echo $rv;
    }
    
    /**
    * #[route(/api/manuscripts/{signature}/detail)]
    */
    public static function manuscript_detail($signature)
    {
        $signature= urldecode($signature);
        $rv= mod_manuscripts::get_manuscript_detail($signature);       
        
        echo $rv;
    }
    
    
    
    
}

class ctrl_search extends cls_common_ctrl
{
    /**
     * 
     * #[route(/api/search/manuscripts)]
     */
    public static function search_manuscripts()
    {
        
        $echo_results=function($query,$subject,$output,$hits_entries,$hits_manuscripts,$data)
        {
            
            header('Content-Type: text/xml');
            echo "<search hits_in_entries='$hits_entries' hits_in_manuscripts='$hits_manuscripts' query='$query' subject='$subject' output='$output'>\n"
                    . "<results>\n" .$data . "\n</results>\n</search>";
            die();
        };
        $query=$_GET["q"];
        $query=explode(";",$query)[0];
        
        $subject=$_GET["s"];
        
        $output=$_GET["o"]; //c=collection, m=manuscript, o=place of origin
        if ($output=="")
            $output="c";
        if ($query=="")
            echo "";
        
        if ($subject=="")
            $subject="r"; //r=record, m=manuscript name, d=description,s=signature,o=place of origin
        
        
        $signatures_found=[];
        $records_found=[];
        $hits_entries=0;
        $hits_manuscripts=0;
        
        if ($subject=="r")
        {
            $q="select rkp_signatura,id from zaznamy where nazev like '%".$query."%'";
 
            $result= dbCon::query($q);
            while ($r=$result->fetch_assoc())
            {
                $signatures_found[]="'".$r["rkp_signatura"]."'";
                $records_found[]=$r["id"];
                $hits_entries++;
            }
            
            
        }
        elseif ($subject=="m" || $subject=="d" || $subject=="o" || $subject=="s")
        {
            $hits_entries=-1;//entries not searched
            if ($subject=="m")
                $field="nazev";
            else if ($subject=="d")
                $field="popis";
            else if ($subject=="o")
                $field="misto_vzniku";
            else if ($subject=="s")
                $field="signatura";
            
            $q="select signatura from rukopisy where upper($field) like upper('%".$query."%')";

            $result= dbCon::query($q);
            while ($r=$result->fetch_assoc())
            {
                $signatures_found[]="'".$r["signatura"]."'";

            }
            
        }
        /*
         * output: 
         *  c(ollection):
         *          collection 1
         *              manuscript 1
         *                  (record 1)
         *              manuscript 2
         *                  (record 1)
         *  m(anuscript)
         *          manuscript 1
         *              (record 1)
         *          manuscript 2
         *              (record 1)
         * (place of) o(rigin)
         *          place 1
         *              manuscript 1
         *                  (record 1)
         * etc. i. e. in the results do we always want manuscripts, if we search for records, we want records too.
         */
        $signatures_found= array_unique($signatures_found);
        $hits_manuscripts=sizeof($signatures_found);
        
        
        
        if (sizeof($signatures_found)==0)//nothing found
        {
            $echo_results($query,$subject,$output,0,0,"");
        }
        
        $load_records_instantly=($subject=="r" && sizeof($records_found)<100);
        //we get all manuscripts 
        if ($output=="c")
        {           
            $args=[
                    "instant_exp"=>true,
                    "get_mns_fn"=>"mod_manuscripts::get_manuscripts_ex",
                    "get_mns_args"=>
                        [
                            "signatures"=>$signatures_found,
                            "instant_exp"=>$load_records_instantly,
                            "get_records_fn"=>$load_records_instantly==true ? "mod_manuscripts::get_records_ex":"api/manuscripts/{signature}/records",
                            "get_records_args"=>
                            [
                                "record_ids"=>$records_found
                            ]
                        ]
                  ];

            $echo_results($query,$subject,$output,$hits_entries,$hits_manuscripts,mod_manuscripts::get_collections_ex($args));
        }
        else if ($output=="m")
        {
            $args=[
                    "signatures"=>$signatures_found,
                    "instant_exp"=>$load_records_instantly,
                    "get_records_fn"=>$load_records_instantly==true ? "mod_manuscripts::get_records_ex":"api/manuscripts/{signature}/records",
                    "get_records_args"=>
                    [
                        "record_ids"=>$records_found
                    ]
                  ];
            $echo_results($query,$subject,$output,$hits_entries,$hits_manuscripts,mod_manuscripts::get_manuscripts_ex($args));
        }
        else if ($output=="o")
        {            
            $args=[
                    "instant_exp"=>true,
                    "signatures"=>$signatures_found,
                    "get_mns_fn"=>"mod_manuscripts::get_manuscripts_ex",
                    "get_mns_args"=>
                        [
                            "signatures"=>$signatures_found,
                            "instant_exp"=>$load_records_instantly,
                            "get_records_fn"=>$load_records_instantly==true ? "mod_manuscripts::get_records_ex":"api/manuscripts/{signature}/records",
                            "get_records_args"=>
                            [
                                "record_ids"=>$records_found
                            ]
                        ]
                  ];

            $echo_results($query,$subject,$output,$hits_entries,$hits_manuscripts,mod_manuscripts::get_places_of_origin_ex($args));
            
        }
        
        //var_dump($signatures_found,$records_found);
        
        
        
                
    }
}