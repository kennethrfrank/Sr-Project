import {Component} from 'react'
import 'semantic-ui-css/semantic.min.css'
import {Input} from 'semantic-ui-react'
import './search-box.styles.css'




const SearchBox = ({onChangeHandler})=>{
    return(
        <Input 
                  icon='search' 
                  className="searchArtists" 
                  fluid 
                  placeholder="Search Artists" 
                  onChange={onChangeHandler}/>
    );
}
export default SearchBox;