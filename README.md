# Popup Handler

<p>
	Script needs jQuery to work.
</p>

<p>
	To start working you need to :
	<ol>
		<li>
			Create object of PopupHandler class.
			<pre>var popupHandler = new PopupHandler&lpar;&rpar;;</pre>
		</li>
		<li>
			Call <ins>init</ins> method on this object.
			<pre>var popupHandler = new PopupHandler&lpar;&rpar;;
popupHandler.init&lpar;&rpar;;</pre>
		</li>
	</ol>
</p>

<p>
	You should pass settings object into <ins>init</ins> method to achieve proper work of script, like <ins>ajaxUrl</ins> or <ins>contentAttribute</ins>
	<pre>var settings = &lcub;
	"contentAttribute" : "data-popup-content"
	&rcub;;
var popupHandler = new PopupHandler&lpar;&rpar;;
popupHandler.init&lpar;settings&rpar;;</pre>
</p>

<p>
	If you are working with Wordpress and want to use ajax to get popup content, you should pass both <ins>ajaxUrl</ins> and <ins>ajaxAction</ins>.
	<pre>var settings = &lcub;
	"contentAttribute" : "data-popup-content"
	&rcub;;
var popupHandler = new PopupHandler&lpar;&rpar;;
popupHandler.init&lpar;settings&rpar;;</pre>
</p>

<h2>Settings: </h2>
<ul>
	<li>
		<dt>
			<h3>triggerAttribute</h3>
		</dt>
		<dd>
			<p>Attribute to trigger popup with id specified as value of this attribute.</p>
			<p>For example click on element with attribute <ins>data-popup</ins>="login" will trigger popup with ID "login" to show.</p>
			<h5>Default : "data-popup"</h5>
			<p>Type : string</p>
			<p>
				<pre>&lt;<span>button</span> data-popup="login"&gt;<span>Sign in</span>&lt;/<span>button</span>&gt;</pre>
			</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>deferredTriggerAttribute</h3>
		</dt>
		<dd>
			<p>Element with <ins>deferredTriggerAttribute</ins> triggers script to get popup content for id defined in it, but click on this element doesn't trigger popup to show.</p>
			<p>Can be used later with help of method showPopup();</p>
			<h5>Default : "data-deferred-popup"</h5>
			<p>Type : string</p>
			<p>
				<pre>&lt;<span>button</span> data-deferred-popup="login"&gt;<span>Sign in</span>&lt;/<span>button</span>&gt;</pre>
			</p>
		</dd>
	</li>
		<li>
		<dt>
			<h3>contentAttribute</h3>
		</dt>
		<dd>
			<p>Attribute to specify wrapper for content for popup, if this popups ID is in the <ins>getFromPage</ins> array.</p>
			<p>For example <ins>data-content</ins>="login" should hold content for popup with ID="login".</p>
			<h5>Default : "data-content"</h5>
			<p>Type : string</p>
			<p>
				<pre><span>&lt;div data-content="login"&gt;</span>&lt;<span>div&gt;</span>Content for login popup&lt;/<span>div</span>&gt;&lt;/<span>div</span>&gt;</pre>
			</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>additionalDataAttributes</h3>
		</dt>
		<dd>
			<p>If element with <ins>triggerAttribute</ins> has attribute that contained in <ins>additionalDataAttributes</ins> array, value of additional attribute will be passed to server via ajax as request data.</p>
			<h5>Default : [ ]</h5>
			<p>Type : array of strings</p>
			<p>
				<pre>&lt;<span>button</span> data-popup="register" <ins>data-age</ins>="21"&gt;<span>Sign up</span>&lt;/<span>button</span>&gt;</pre>
			</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>getFromPage</h3>
		</dt>
		<dd>
			<p>Array of popup IDs that you want to fill from loaded page.</p>
			<p>If popup ID is in this array, ajax would not try to get content for this popup from server. Popup will be filled with content taken from element with <ins>contentAttribute</ins> with this popup ID as value.</p>
			<p>For example <ins>data-content</ins>="login" should hold content for popup with ID="login".</p>
		
			<h5>Default : [ ]</h5>
			<p>Type : array of strings</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>popupClass</h3>
		</dt>
		<dd>
			<p>Class, that will be added to popup.</p>
			<h5>Default : 'b-popup'</h5>
			<p>Type : string</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>popupCloseSelectors</h3>
		</dt>
		<dd>
			<p>Selectors to trigger popup closing.</p>
			<h5>Default : '[data-popup-close]'</h5>
			<p>Type : string | array of strings</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>disabledFormClass</h3>
		</dt>
		<dd>
			<p>Class, that will be added to form on its submitting.</p>
			<h5>Default : 'js-disabled'</h5>
			<p>Type : string</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>closeOnWrapperClick</h3>
		</dt>
		<dd>
			<p>Whether popup closes on wrapper click or not.</p>
			<h5>Default : true</h5>
			<p>Type : boolean</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>animatedShow</h3>
		</dt>
		<dd>
			<p>Whether popup appears on screen smoothly or instantly.</p>
			<h5>Default : true</h5>
			<p>Type : boolean</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>popupShowSpeed</h3>
		</dt>
		<dd>
			<p>Specifies speed for popup to appear on screen.</p>
			<h5>Default : 200</h5>
			<p>Type : int (ms)</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>backgroundTransition</h3>
		</dt>
		<dd>
			<p>Whether popup wrapper changes its background color smoothly or instantly.</p>
			<h5>Default : true</h5>
			<p>Type : boolean</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>backgroundTransitionSpeed</h3>
		</dt>
		<dd>
			<p>Specifies speed for popup wrapper to change its background color.</p>
			<h5>Default : 200</h5>
			<p>Type : int (ms)</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>darkBackground</h3>
		</dt>
		<dd>
			<p>Whether popup wrapper has dark background color or light.</p>
			<h5>Default : false</h5>
			<p>Type : boolean</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>customWrapperBackground</h3>
		</dt>
		<dd>
			<p>Specifies background color for popup wrapper.</p>
			<p><ins>darkBackground</ins> popoperty will be ignored if <ins>customWrapperBackground</ins> is different than ''.</p>
			<h5>Default : ''</h5>
			<p>Type : string with suitable for css <i>background</i> property</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>focusOnFirstInput</h3>
		</dt>
		<dd>
			<p>Whether form in popup has focus on its first input or not.</p>
			<h5>Default : true</h5>
			<p>Type : boolean</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>ajaxUrl</h3>
		</dt>
		<dd>
			<p>Specifies url for ajax requests.</p>
			<h5>Default : ''</h5>
			<p>Type : string</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>popupHandlers</h3>
		</dt>
		<dd>
			<p>Object with pairs : <pre>"popupID" : callback()</pre></p>
			<p>Callback function will be called after submission of form with <ins>id</ins> wich matches specified popupID.</p>
			<p>Submit handler ( on form $('form#' + popupID) ) starts to listen for submission only after suitable form appears in popup.</p>
			<h5>Default : { }</h5>
			<p>Type : object</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>ajaxAction</h3>
		</dt>
		<dd>
			<p>Specifies action field in ajax request object.</p>
			<p>Can be used for WordPress ajax requests.</p>
			<h5>Default : ''</h5>
			<p>Type : string</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>ajaxDataObjectName</h3>
		</dt>
		<dd>
			<p>Specifies field name for object with request data for all popups.</p>
			<p>Can be used on server to recieve data from client: 
				<pre>$_POST&lsqb;'popupRequestData'&rsqb;</pre>
			</p>
			<h5>Default : 'popupRequestData'</h5>
			<p>Type : string</p>
		</dd>
	</li>
</ul>