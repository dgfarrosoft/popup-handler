# Popup Handler
<h1>Settings: </h1>
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
			<h3>contentAttribute</h3>
		</dt>
		<dd>
			<p>Attribute to specify wrapper for content where popup should get its content from, if this popups ID is in the <ins>getFromPage</ins> array.</p>
			<p>For example <ins>data-content</ins>="login" should hold content for popup with ID="login".</p>
			<h5>Default : "data-content"</h5>
			<p>Type : string</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>additionalDataAttributes</h3>
		</dt>
		<dd>
			<p>If element with <ins>triggerAttribute</ins> has attribute that contained in <ins>additionalDataAttributes</ins> array, value of that attribute will be passed to server via ajax as request data.</p>
			<p>
				<pre>&lt;<span class="pl-ent">template</span> <span class="pl-e">is</span>=<span class="pl-s"><span class="pl-pds">"</span>juicy-html<span class="pl-pds">"</span></span> <span class="pl-e">content</span>=<span class="pl-s"><span class="pl-pds">"</span>./path/to/file.html<span class="pl-pds">"</span></span>&gt;&lt;/<span class="pl-ent">template</span>&gt;</pre>
			</p>
			<h5>Default : [ ]</h5>
			<p>Type : array of strings</p>
		</dd>
	</li>
	<li>
		<dt>
			<h3>deferredTriggerAttribute</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>disabledFormClass</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>popupClass</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>popupWrapperClass</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>popupCloseSelectors</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>popupContents</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>popupHandlers</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>focusOnFirstInput</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>closeOnWrapperClick</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>ajaxUrl</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>animatedShow</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>popupShowSpeed</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>backgroundTransition</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>backgroundTransitionSpeed</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>darkBackground</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>ajaxAction</h3>
		</dt>
		<dd></dd>
	</li>
	<li>
		<dt>
			<h3>popupStyles</h3>
		</dt>
		<dd></dd>
	</li>
</ul>