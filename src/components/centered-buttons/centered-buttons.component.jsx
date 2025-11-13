import { Component } from 'react'
import {Grid, Button, Icon} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'
import './centered-buttons.styles.css'

// class CenteredButtons extends Component{
//     render(){
//         const {buttons, socials} = this.props;
//         return(
//             <Grid.Row centered columns={socials.length+1} >

         
//             {socials.map((social)=>{
              
//               return(
//                 <Grid.Column key={social.platform} className="theButtons" textAlign="center">
//                   <Button fluid className="blackButton" href={social.link} icon={social.platform}></Button>
//                 </Grid.Column>
//               );
//             })}
           
//           </Grid.Row>
          
//         )
//     }
// }

const CenteredButtons = ({socials}) => {
return(
  <Grid className='topLogoRow'>
    <Grid.Row centered columns={socials.length + 1} className="socialButtons">


      {socials.map((social) => {

        return (
          <Grid.Column key={social.platform} className="theButtons" textAlign="center">
            <Button fluid className="blackButton" href={social.link} icon={social.platform}></Button>
          </Grid.Column>
        );
      })}

    </Grid.Row>
  </Grid>

)
}

export default CenteredButtons;

//TODO: MAKE THIS WORK FOR EITHER ICONS OR NAMED BUTTONS