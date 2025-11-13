import { Grid, Button } from "semantic-ui-react";
import './gallery.styles.scss';

const Gallery = ({gallery, setGallery}) =>{
    return(
        <Grid centered>
            <Grid.Column width={15}>
                <Button className="blackGButton" fluid onClick={
                    ()=>{
                        if(gallery !== "nclyne"){
                            setGallery("nclyne");
                        }
                    }
                }>
                    Nclyne Legacy
                </Button>
                <Button className="blackGButton" fluid onClick={
                    ()=>{
                        if(gallery !== "digitalexpression"){
                            console.log("changing");
                            setGallery("digitalexpression");
                        }
                    }
                }>
                    An Exploration in Digital Expression
                </Button>
                <Button className="blackGButton" fluid href="http://nclyne.gallery">
                    Nclyne Voxels HQ
                </Button>
                <iframe title="onCyber" className="onCyberGallery" src={`https://oncyber.io/${gallery}`}>

                </iframe> 
            </Grid.Column>
        </Grid>
    );
};

export default Gallery;