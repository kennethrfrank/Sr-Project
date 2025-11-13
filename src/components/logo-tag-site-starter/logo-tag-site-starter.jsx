import {Component, Fragment} from 'react'
import {Grid, Image, Header, Segment, Button} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'
import './logo-tag-site-starter.styles.css'
import CenteredButtons from '../centered-buttons/centered-buttons.component'
import {Outlet, Link} from 'react-router-dom';

import { auth, signInWithGooglePopup, createUserDocumentFromAuth } from '../../utils/firebase/firebase.utils'



const LogoTagSiteStarter = ({logo, tagline, buttons, socials, setShopifyActive})=>{

  
  const logGoogleUser = async ()=>{
    try{
      const response = await signInWithGooglePopup();
      const {user} = response;
      console.log(response);
      const userDocRef = await createUserDocumentFromAuth(user);
      console.log(userDocRef);
    }catch(err){
      console.log(err);
    }
  }

  return(
    <Fragment>
        <Grid container centered className='topLogoRow'>
          <Grid.Row className="logoAndTag">

            <Grid.Column width="8"  className="" floated="left">
               <Link to="/"><Image className="NclyneLogo" src={logo} onClick={()=>{
                setShopifyActive(false);
               }}></Image></Link> 
            </Grid.Column>
            <Grid.Column width="5" className="tagContainer" floated="right" textAlign='right'>
              <Button fluid className='blackButton' onClick={logGoogleUser}> Sign Up </Button>
              {/* <h4 className="tagline">
              {tagline}
              </h4> */}
            </Grid.Column>
            
          </Grid.Row>
 
        </Grid>
        <CenteredButtons buttons={buttons} socials={socials}/>
        <Outlet />
    </Fragment>
)
}

export default LogoTagSiteStarter;