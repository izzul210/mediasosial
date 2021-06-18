
import React, { Component } from 'react'
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { likePost, unlikePost } from '../../redux/actions/dataAction';
import './LikeButton.css';

export class LikeButton extends Component {
    likedPost = () => {
        if(
            this.props.user.likes &&
            this.props.user.likes.find(
                (like) => like.postId === this.props.postId
            )
        )
        return true;
        else return false;
    };
    likePost = () => {
        this.props.likePost(this.props.postId);
    }
    unlikePost = () => {
        this.props.unlikePost(this.props.postId);
    };

    render() {
        const {authenticated} = this.props.user;
        const likeButton = !authenticated ? (
            <Link to="/login">
                <button title='Like' className='unliked'>
                <i class="fa fa-thumbs-o-up" aria-hidden="true"></i>
                </button>
            </Link>
        ) : (
            this.likedPost() ? (
                    <button onClick={this.unlikePost} title='Unlike' className='liked'>
                      <i class="fa fa-heartbeat" aria-hidden="true"></i>
                    </button>

            ) : (
                    <button onClick={this.likePost} title='Like' className='unliked'>
                      <i class="fa fa-thumbs-o-up" aria-hidden="true"></i>
                    </button>
                
            )
        );
        return likeButton;
    }
}

LikeButton.propTypes = {
    user: PropTypes.object.isRequired,
    postId: PropTypes.string.isRequired,
    likePost: PropTypes.func.isRequired,
    unlikePost: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({
    user: state.user
})

const mapActionsToProps = {
    likePost,
    unlikePost
}

export default connect(mapStateToProps, mapActionsToProps)(LikeButton);




