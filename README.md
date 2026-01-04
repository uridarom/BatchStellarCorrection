# BatchStellarCorrection
<p>A batch processing script for astronomical landscape photos, meant to aid with the panoramic stitching process. Available as a plug-in for PixInsight.</p>

<p>The script will automatically apply the BlurXTerminator program by Russell Croman to only the stars in a list of images, separated using StarXTerminator (also by RC). This tends to yield better and more natural looking results compared to running the sharpening on the original image. This can also help stitching programs like Image Composite Editor or PTGUI to create panoramas more accurately.</p>

<p>This scrpit is available for installation in PixInsight.</p>

<p>      1. In PixInsight, go to <code class="language-plaintext highlighter-rouge">Resources</code>–&gt; <code class="language-plaintext highlighter-rouge">Updates</code> –&gt; <code class="language-plaintext highlighter-rouge">Manage Repositories</code>
<br />      2. Click the “Add” button on the bottom left of the popup
<br />      3. Enter the repository <code class="language-plaintext highlighter-rouge">https://uridarom.com/pixinsight/scripts/BatchStellarCorrection/</code> and click “OK”
<br />      4. Close the window and click on <code class="language-plaintext highlighter-rouge">Resources</code> –&gt; <code class="language-plaintext highlighter-rouge">Updates</code> –&gt; <code class="language-plaintext highlighter-rouge">Check For Updates</code>
<br />      5. Click “Apply” on the bottom right of the popup and restart PixInsight
<br />      6.  The script should appear under <code class="language-plaintext highlighter-rouge">Scripts</code> –&gt; <code class="language-plaintext highlighter-rouge">Batch Processing</code> –&gt; <code class="language-plaintext highlighter-rouge">BatchStellarCorrection</code></p>

