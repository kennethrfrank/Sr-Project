import {Grid, Embed, Segment, Header} from 'semantic-ui-react';
import './content.styles.scss';
import parse from 'html-react-parser';
import nclyneblog from './nclyne_blog.png';

const Content = ({videos, articles})=>{
    return(
    <Grid stackable centered className='contentGrid'>
        
        <Grid.Row stretched>
        <Grid.Column width={5} className='video-container' textAlign="center" verticalAlign='center'>
            <Header className='columnHeader'>Latest Videos</Header>
            <Grid centered stackable className='vidGrid'>
            {
                videos.map((video)=>{
                    console.log(video)
                    return(
                        <Grid.Column width={15}>
                           

                            <Embed
                                className='embededElement'
                                key={video.id.videoId}
                                source={"youtube"} placeholder={video.snippet.thumbnails.high.url} id={video.id.videoId}>
                            </Embed>
                            <Header className='videoTitle'>{video.snippet.title}</Header>
                        </Grid.Column>
                    )
                })
            }
            </Grid>
        </Grid.Column>
        <Grid.Column width={11} className="listOfArticles" >
        <Header className='columnHeader'><img alt="nclyne.blog" src={nclyneblog} style={{width: "50%", height: "auto"}}></img></Header>
        <Grid centered stackable className='articleGrid'>

        {
                articles.map((article)=>{
                    console.log(article);
                    return(
                        
                        <Grid.Column width={5}>
                            <Segment inverted className='articleSegment'>
                                <Header as="h1">
                                    {article.title} by {article.author}
                                </Header>
                                <div>
                                    {parse(article.content)}
                                </div>
                            </Segment>
                        </Grid.Column>
                        

                    )
                })
            }
        </Grid>
        </Grid.Column>

            
       </Grid.Row>
    </Grid>
    );
};

export default Content;

//From Teji SPA -- Body min-height 100% - child height 100vh