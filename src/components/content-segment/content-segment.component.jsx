import { Component } from 'react'
import { Segment, Header, Image } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'
import './content-segment.styles.css'



// const contentImage = require(promotion);

const ContentSegment = ({segment})=>{

    const placeimage = ()=>{
        if(segment.img != null){
            
            console.log("t");
            return(
                <Image className="segmentImage" src={segment.img} onClick={
                    ()=>{
                        window.location.assign(segment.link);
                    }
                } />
            );
        }
    };

    console.log(segment);
    return (

        <Segment textAlign='center' className='curatedByNclyneSegment'>
            <Header as='h2' className='curationProjectCopy'>
                {segment.title}
            </Header>
            {placeimage()}
            
            {segment.subCopy.map((copy)=>{
                return(
                    <Header sub className='curationProjectCopy'>
                        {copy}
                    </Header>
                )
            })}
            
        </Segment>
    )
}

export default ContentSegment;

//TODO: make modular with an image and headers


