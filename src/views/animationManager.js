/**
 * External libraries
 */
const _ = require('underscore');

/**
 * Project requirements
 */
const {
  ANIMATION_TIME,
  SCROLL_ANIMATION_SPEED
} = require('../parameters/constants');

/**
  * Is an element visible in viewPort ?
  * @access private
  * @param {object} elementPosition - All the element position informations
  * @param {int} elementPosition.left - Left coordinate
  * @param {int} elementPosition.top - Top coordinate
  * @param {int} elementPosition.width - Width of element
  * @param {int} elementPosition.height - Height of element
  */
function isInScreen(elementPosition) {
  //TODO in case of visible relation but not comment
  return (elementPosition.top + elementPosition.height >= $('#graphContainer').scrollTop()) &&
    (elementPosition.top <= $('#graphContainer').scrollTop() + $('#graphContainer').height()) &&
    (elementPosition.left + elementPosition.width >= $('#graphContainer').scrollLeft()) &&
    (elementPosition.left <= $('#graphContainer').scrollLeft() + $('#graphContainer').width());
}

/**
 * Manage animations
 */
class AnimationManager {
  // --- Vars and accessors

  // --- Functions
  /**
   * Create the AnimationManager
   * @class
   */
  constructor() {
    return this;
  }

  /**
    * Init the AnimationManager
    * @access public
    * @returns {AnimationManager} this
    */
  init() {
    return this;
  }

  /**
    * Animate (moove, resize...) a comment (or a subpart of it)
    * @access public
    * @param {CommentView} commentView - The comment to animate
    * @param {object} elementDOM - The DOM element to animate - usually commentView.commentView
    * @param {object} targetedValues - The elements attributes targeted values
    */
  animate(commentView, elementDOM, targetedValues) {    
    const elementIsInScreen = isInScreen({
      left: parseInt(commentView.commentView.css('left')),
      top: parseInt(commentView.commentView.css('top')),
      width: commentView.commentView.outerWidth(),
      height: commentView.commentView.outerHeight()
    });

    var elementWillBeInScreen = elementIsInScreen;
    if ((targetedValues.left != undefined) && (targetedValues.top != undefined)) {
      elementWillBeInScreen = isInScreen({
        left: targetedValues.left,
        top: targetedValues.top,
        width: commentView.commentView.outerWidth(),
        height: commentView.commentView.outerHeight()
      });
    }

    const animationKey = commentView.commentModel.id + _.keys(targetedValues).join(',');

    if (elementIsInScreen || elementWillBeInScreen) {
      elementDOM.clearQueue(animationKey)
        .stop(animationKey)
        .animate(targetedValues, {
          duration: ANIMATION_TIME,
          easing: 'swing',
          queue: animationKey,
          progress: (animation, progress, remainingMs) => {
            if(commentView.parentRelationView) {
              commentView.parentRelationView.refresh();
            }
            _.each(commentView.childRelationsView, (relationView) => {
              relationView.refresh();
            });
          }
        })
        .dequeue(animationKey);
    }
    else {
      elementDOM.clearQueue(animationKey).stop(animationKey);

      // Don't need to animate
      _.each(targetedValues, (targetValue, targetName) => {
        if (targetName === 'left' || targetName === 'top') {
          targetValue = targetValue + 'px';
        }
        elementDOM.css(targetName, targetValue);
      });

      if(commentView.parentRelationView) {
        commentView.parentRelationView.refresh();
      }
      _.each(commentView.childRelationsView, (relationView) => {
        relationView.refresh();
      });
    }
  }

  /**
    * Hide a comment
    * @access public
    * @param {CommentView} commentView - The comment to hide
    * @param {object} whereToHide - Where the comment should hide
    * @param {int} whereToHide.left - Left coordinate
    * @param {int} whereToHide.top - Top coordinate
    */
  hide(commentView, whereToHide) {
    commentView.commentView.fadeOut({
      duration: ANIMATION_TIME,
      easing: 'swing',
      queue: false
    });
    this.animate(commentView, commentView.commentView, whereToHide);
  }

  /**
    * Show a comment
    * @access public
    * @param {CommentView} commentView - The comment to show
    * @param {object} whereToStart - Where the comment should start before showing
    * @param {int} whereToStart.left - Left coordinate
    * @param {int} whereToStart.top - Top coordinate
    */
  show(commentView, whereToStart) {
    commentView.commentView.css('left', whereToStart.left);
    commentView.commentView.css('top', whereToStart.top);
    commentView.commentView.fadeIn({
      duration: ANIMATION_TIME,
      easing: 'swing',
      queue: false
    });
  }

  /**
    * Fold a comment actionsContainer
    * @access public
    * @param {CommentView} commentView - The comment to fold
    */
  foldActionsContainer(commentView) {
    this.animate(commentView,
      commentView.commentView.find('.commentFooter>.actionsContainer'), {
      'max-height': 0
    });

    commentView.commentView.find('.showActionsContainer')
      .clearQueue()
      .stop()
      .fadeIn({
        duration: ANIMATION_TIME,
        easing: 'swing',
        queue: false
      });
  }

  /**
    * Unfold a comment actionsContainer
    * @access public
    * @param {CommentView} commentView - The comment to unfold
    * @param {object} targetHeight - actionsContainer targeted max-height
    */
  unfoldActionsContainer(commentView, targetHeight) {
    this.animate(commentView,
      commentView.commentView.find('.commentFooter>.actionsContainer'),
      targetHeight
    );

    commentView.commentView.find('.showActionsContainer')
      .clearQueue()
      .stop()
      .fadeOut({
        duration: ANIMATION_TIME,
        easing: 'swing',
        queue: false
      });
  }

  /**
    * Scroll main view with constant speed (if not too much...) or constant time
    * @access public
    * @param {object} mainDOM - The graph container
    * @param {object} targetedValues - The scroll targeted values
    * @param {int} targetedValues.scrollTop - scrollTop targeted values
    * @param {int} targetedValues.scrollLeft - scrollLeft targeted values
    * @param {boolean} constantSpeed - true if constant speed, false if constant time
    * @returns {int} scroll animation time
    */
  scrollMain(mainDOM, targetedValues, constantSpeed = true) {
    const deltaTop = Math.abs(mainDOM.scrollTop() - targetedValues.scrollTop);
    const deltaLeft = Math.abs(mainDOM.scrollLeft() - targetedValues.scrollLeft);
    const scrollDuration = constantSpeed
      ? Math.min(
          Math.floor(
            Math.sqrt(deltaTop * deltaTop + deltaLeft * deltaLeft) / SCROLL_ANIMATION_SPEED)
        , 2 * ANIMATION_TIME)
      : ANIMATION_TIME;

    mainDOM.clearQueue()
      .stop()
      .animate(targetedValues, {
        duration: scrollDuration,
        easing: 'swing'
    });

    return scrollDuration;
  }

}

module.exports = new AnimationManager();
