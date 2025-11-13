import 'semantic-ui-css/semantic.min.css'
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"
import {Grid, Image, Header, Button, Segment} from 'semantic-ui-react'
import Slider from 'react-slick'
import './content-slider.styles.css'


const ContentSlider = ({content})=>{
    const settings = {
    dots: false,
            slidesToShow: 1,
            slidesToScroll: 1,
            infinite: true,
            autoplay: true,
            autoplaySpeed: 9000
            
  };
  return(
    <Slider className='sliderContainerStyling' {...settings}>
        {content.map((item)=>{
          console.log();
          

      
        return(
        <Grid key={item.id} verticalAlign='middle' textAlign='center' className={`sliderGrid nft${item.id}`}>
          <Grid.Row centered verticalAlign='middle'>
            <Grid.Column width="16">

            </Grid.Column>

          </Grid.Row>

          <Grid.Row stretched centered={true} className={"item"+item.id} verticalAlign="middle"> 


            {/* <Grid.Column stretched tablet="8" computer="8" mobile="7"
            className='visualContent' 
            style={{backgroundImage: "url('"+item.image_url+"')"}} 
            onClick={()=>{
                console.log("click");
                window.location.assign(item.permalink);
              }}
            ></Grid.Column> */}
            <Grid.Column width="14"
            className='visualContent' 
            verticalAlign='middle'
            >
              <Image 
              wrapped
              src={item.image_url}
              centered
              verticalAlign='middle'
              className='sliderImage'
              onClick={()=>{
                console.log("click");
                window.location.assign(item.permalink);
              }}
              ></Image>
              <Header attached="bottom" 
              className='sliderHeader'>{item.name}</Header>

               <Segment attached="top" className='artistDetails'>
                    {item.description}
                </Segment>
                <Button fluid className="sliderButton" onClick={
                    ()=>{
                      window.location.assign(item.permalink);
                    }
                  }> Support {item.traits.map((trait)=>{
                    if (trait.trait_type.includes("Artist")){
                    return trait.value } else{
                      return null
                    }
                  })}</Button>
 

            </Grid.Column>

           


            {/* <Grid.Column tablet="8" computer="8" mobile="15" className='artistDetailsRow'>
              

                

            </Grid.Column> */}
          </Grid.Row>

        </Grid>
        )
        })}
      </Slider>
  )
}



export default ContentSlider;