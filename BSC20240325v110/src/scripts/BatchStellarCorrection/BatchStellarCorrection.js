#define TITLE "BatchStellarCorrection"
#define VERSION "1.1.0"

#feature-id BatchStellarCorrection : Batch Processing > BatchStellarCorrection

#feature-info This utility will apply BlurXterminator correct-only on only the star component of the image (created using StarXterminator), which often yields a better result.< br />\
	Made by Uri Darom

#include <pjsr/DataType.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/NumericControl.jsh>

#ifndef __PJSR_SectionBar_jsh
#include <pjsr/SectionBar.jsh>
#endif

#define SETTINGS_MODULE "BatchStellarCorrection"

#define Ext_DataType_Complex     1000  // Complex object with settings
#define Ext_DataType_StringArray 1001  // Array of strings
#define Ext_DataType_JSON        1002  // Serializable object
;


// Taken from WCSmetadata.jsh
/*
 * ObjectWithSettings: Base class for persistent classes.
 */
function ObjectWithSettings( module, prefix, properties )
{
   this.module = module;
   this.prefix = prefix ? prefix.replace( / /g, '' ) : null;
   this.properties = properties;

   this.MakeSettingsKey = function( property )
   {
      let key = "";
      if( this.module && this.module.length > 0 )
         key = this.module + "/";
      if( this.prefix && prefix.length > 0 )
         key = key + this.prefix + "/";
      return key + property;
   };

   this.LoadSettings = function()
   {
      for ( let i = 0; i < this.properties.length; ++i )
      {
         let property = this.properties[i][0];
         if ( property )
            if ( this.properties[i][1] == Ext_DataType_Complex )
            {
               if ( this[property] && typeof( this[property].LoadSettings ) === 'function' )
                  this[property].LoadSettings();
            }
            else if ( this.properties[i][1] == Ext_DataType_JSON )
            {
               let value = Settings.read( this.MakeSettingsKey( property ), DataType_UCString );
               if ( Settings.lastReadOK )
                  this[property] = JSON.parse( value );
            }
            else if ( this.properties[i][1] == Ext_DataType_StringArray )
            {
               let value = Settings.read( this.MakeSettingsKey( property ), DataType_UCString );
               if ( Settings.lastReadOK )
                  this[property] = value.split("|");
            }
            else
            {
               let value = Settings.read( this.MakeSettingsKey( property ), this.properties[i][1] );
               if ( Settings.lastReadOK )
                  this[property] = value;
            }
      }
   };

   this.SaveSettings = function()
   {
      for ( let i = 0; i < this.properties.length; ++i )
      {
         let property = this.properties[i][0];
         if ( this[property] != null )
         {
            if ( this.properties[i][1] == Ext_DataType_Complex )
               this[property].SaveSettings();
            else if ( this.properties[i][1] == Ext_DataType_JSON )
               Settings.write( this.MakeSettingsKey( property ), DataType_UCString, JSON.stringify( this[property] ) );
            else if ( this.properties[i][1] == Ext_DataType_StringArray )
            {
               let concatString = this.CreateStringArray( this[property] );
               if ( concatString != null )
                  Settings.write( this.MakeSettingsKey(property), DataType_UCString, concatString );
            }
            else
               Settings.write( this.MakeSettingsKey( property ), this.properties[i][1], this[property] );
         }
         else
            Settings.remove( this.MakeSettingsKey( property ) );
      }
   };

   this.DeleteSettings = function()
   {
      Settings.remove( this.prefix );
   };

   this.MakeParamsKey = function( property )
   {
      let key = "";
      if ( this.prefix && this.prefix.length > 0 )
         key = this.prefix.replace( "-", "" ) + "_";
      return key + property;
   };

   this.LoadParameters = function()
   {
      for ( let i = 0; i < this.properties.length; ++i )
      {
         let property = this.properties[i][0];
         if ( property )
            if ( this.properties[i][1] == Ext_DataType_Complex )
               this[property].LoadParameters();
            else
            {
               let key = this.MakeParamsKey( property );
               if ( Parameters.has( key ) )
               {
                  switch( this.properties[i][1] )
                  {
                  case DataType_Boolean:
                     this[property] = Parameters.getBoolean( key );
                     break;
                  case DataType_Int8:
                  case DataType_UInt8:
                  case DataType_Int16:
                  case DataType_UInt16:
                  case DataType_Int32:
                  case DataType_UInt32:
                  case DataType_Int64:
                  case DataType_UInt64:
                     this[property] = parseInt( Parameters.get( key ) );
                     break;
                  case DataType_Double:
                  case DataType_Float:
                     this[property] = Parameters.getReal( key );
                     break;
                  case DataType_String:
                  case DataType_UCString:
                     this[property] = Parameters.getString( key );
                     break;
                  case Ext_DataType_JSON:
                     // TODO: This is necessary because PI 1.8 doesn't allow " in strings
                     this[property] = JSON.parse( Parameters.getString( key ).replace( /\'\'/g, "\"" ) );
                     break;
                  case Ext_DataType_StringArray:
                     {
                        let value = Parameters.getString( key );
                        if ( value )
                           this[property] = value.split( "|" );
                     }
                     break;
                  default:
                     console.writeln( "Unknown property type '", this.properties[i][1] + "'" );
                  }
               }
            }
      }
   };

   this.SaveParameters = function()
   {
      for ( let i = 0; i < this.properties.length; ++i )
      {
         let property = this.properties[i][0];
         if ( this[property] != null )
         {
            if ( this.properties[i][1] == Ext_DataType_Complex )
               this[property].SaveParameters();
            else if ( this.properties[i][1] == Ext_DataType_JSON )
            {
               // TODO: This is necessary because PI 1.8 doesn't allow " in strings
               Parameters.set( this.MakeParamsKey( property ),
                               JSON.stringify( this[property] ).replace( /\"/g, "\'\'" ) );
            }
            else if( this.properties[i][1] == Ext_DataType_StringArray )
            {
               let array = this.CreateStringArray(this[property]);
               if ( array != null )
                  Parameters.set( this.MakeParamsKey( property ), array );
            }
            else
               Parameters.set( this.MakeParamsKey( property ), this[property] );
         }
      }
   };

   this.CreateStringArray = function( array )
   {
      let str = null;
      for ( let j = 0; j < array.length; ++j )
         if ( array[j] )
            str = (str == null) ? array[j] : str + "|" + array[j];
         else
            str = (str == null) ? "" : str + "|";
      return str;
   };
}


// Taken from ViewDialog.jsh


// ******************************************************************
// ViewDialog: Selection of image views
// ******************************************************************
function ViewDialog(onlyWindows)
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();

   this.labelWidth = this.font.width("Object identifier:M");
   this.editWidth = this.font.width("MMMMMMMMMMMMMMMMMMMMMMMMMMMMM");

   // Views group
   this.views_Group = new GroupBox(this);
   this.views_Group.title = "Views";
   this.views_Group.sizer = new VerticalSizer;
   this.views_Group.sizer.margin = 8;
   this.views_Group.sizer.spacing = 6;


   // List of views
   this.views_List = new TreeBox(this);
   this.views_List.rootDecoration = false;
   this.views_List.alternateRowColor = true;
   this.views_List.multipleSelection = false;
   this.views_List.headerVisible = false;
   this.views_List.numberOfColumns = 1;

   this.views_List.toolTip = "<p>List of images which will be processed.</p>";

   var windows = ImageWindow.openWindows;
   for(var i=0; i<windows.length; i++)
   {
      var w=windows[i];
      var node = new TreeBoxNode(this.views_List);
      node.checkable=true;
      node.checked=false;
      node.setText(0, w.mainView.fullId);
      if(!onlyWindows)
      {
         var views = w.previews;
         for(var j=0; j<views.length; j++)
         {
            var node1 = new TreeBoxNode(this.views_List);
            node1.checkable=true;
            node1.checked=false;
            node1.setText(0, views[j].fullId);
         }
      }
   }
   this.views_Group.sizer.add(this.views_List);

   // Select all
   this.all_Button = new PushButton(this);
   this.all_Button.text = "Select all";
   this.all_Button.onClick = function ()
   {
      for(var i=0; i<this.dialog.views_List.numberOfChildren; i++)
      {
         var node = this.dialog.views_List.child(i);
         node.checked=true;
      }
   };

   // Unselect all
   this.unselect_Button = new PushButton(this);
   this.unselect_Button.text = "Unselect all";
   this.unselect_Button.onClick = function ()
   {
      for(var i=0; i<this.dialog.views_List.numberOfChildren; i++)
      {
         var node = this.dialog.views_List.child(i);
         node.checked=false;
      }
   };

   // Select sizer
   this.select_Sizer = new HorizontalSizer;
   this.select_Sizer.spacing = 6;
   this.select_Sizer.add(this.all_Button);
   this.select_Sizer.add(this.unselect_Button);
   this.select_Sizer.addStretch();
   this.views_Group.sizer.add(this.select_Sizer);


   // Common Buttons
   this.ok_Button = new PushButton(this);
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function ()
   {
      this.dialog.selectedViews = [];
      for(var i=0; i<this.dialog.views_List.numberOfChildren; i++)
      {
         var node = this.dialog.views_List.child(i);
         if(node.checked)
            this.dialog.selectedViews.push(node.text(0));
      }
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton(this);
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function ()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add(this.ok_Button);
   this.buttons_Sizer.add(this.cancel_Button);

   // Global sizer

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   //this.sizer.add(this.helpLabel);
   this.sizer.add(this.views_Group);
   this.buttons_Sizer.addSpacing(8);
   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = "View selection";
   this.adjustToContents();
   //this.setFixedSize();
}

ViewDialog.prototype = new Dialog;


function StarsOnlyBlurX(engine)
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();
   
   this.minWidth = 500;

   this.labelWidth = 100;
   this.editWidth = this.font.width("888888888");

   this.helpLabel = new Label(this);
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.minWidth = 0;
   this.helpLabel.scaledMargin = 6;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text =
      "<p><b>" + TITLE + " Version " + VERSION + "</b> &mdash; " +
      "This utility will apply BlurXterminator to ONLY the stars in the "
	  +"input images (using StarXterminator), which often yields a better result "
	  +"for panorama stitching and general correction."
	  +"<br>A small convolution can also be applied to prevent stars from appearing too sharp."
	  +"<p>Prerequisites:"
	  +"<br>- BlurXterminator"
	  +"<br>- StarXterminator"
	  +"<p>Made by Uri Darom</p>";


   this.CreateTargetGroup = function ()
   {
      // Target images
      this.target_Group = new GroupBox(this);
      this.target_Group.title = "Images:";
      this.target_Group.sizer = new HorizontalSizer;
      this.target_Group.sizer.scaledMargin = 8;
      this.target_Group.sizer.scaledSpacing = 6;

      // List of files
      this.files_List = new TreeBox(this);
      this.files_List.rootDecoration = false;
      this.files_List.alternateRowColor = true;
      this.files_List.multipleSelection = true;
      this.files_List.headerVisible = false;
      this.files_List.toolTip = "<p>List of images to correct.</p>";
      this.files_List.onNodeSelectionUpdated = function ()
      {
         this.dialog.EnableFileControls();
      }
      if (engine.files)
      {
         for (var i = 0; i < engine.files.length; ++i)
         {
            if (engine.files[i].startsWith("window:"))
            {
               var windowId = engine.files[i].substr(7);
               try
               {
                  var window = ImageWindow.windowById(windowId);
                  if (window == null || window.isNull)
                  {
                     engine.files.splice(i, 1);
                     i--;
                  }
                  else
                  {
                     var node = new TreeBoxNode(this.files_List);
                     node.setText(0, windowId);
                  }
               } catch (ex)
               {
                  engine.files.splice(i, 1);
                  i--;
               }
            }
            else
            {
               var node = new TreeBoxNode(this.files_List);
               node.setText(0, engine.files[i]);
            }
         }
      }
      else
         engine.files = new Array();

      // Add file button
      this.addFile_Button = new PushButton(this);
      this.addFile_Button.text = "Add files";
      this.addFile_Button.toolTip = "Add files to the list";
      this.addFile_Button.onMousePress = function ()
      {
         var ofd = new OpenFileDialog;
         ofd.multipleSelections = true;
         ofd.caption = "Select files";
         //ofd.loadImageFilters();
         ofd.filters = [
            [ "All supported formats", ".xisf", ".fit", ".fits", ".fts", ".NEF"],
            [ "FITS Files", ".fit", ".fits", ".fts" ],
            [ "XISF Files",  ".xisf"],
			[ "RAW Files", ".NEF", ".RAW", ".tiff"]
         ];
         if (ofd.execute())
         {
            for (var i = 0; i < ofd.fileNames.length; ++i)
            {
               engine.files.push(ofd.fileNames[i]);
               var node = new TreeBoxNode(this.dialog.files_List);
               node.checkable = false;
               node.setText(0, ofd.fileNames[i]);
            }
            this.dialog.files_List.adjustColumnWidthToContents(1);
         }
         this.dialog.EnableFileControls();
      }

      // Add file button
      this.addView_Button = new PushButton(this);
      this.addView_Button.text = "Add windows";
      this.addView_Button.toolTip = "Add windows to the list";
      this.addView_Button.onMousePress = function ()
      {
         var viewDlg = new ViewDialog(true);
         viewDlg.execute();
         if (!viewDlg.selectedViews)
            return;
         for (var i = 0; i < viewDlg.selectedViews.length; i++)
         {
            engine.files.push("window:" + viewDlg.selectedViews[i]);
            var node = new TreeBoxNode(this.dialog.files_List);
            node.checkable = false;
            node.setText(0, viewDlg.selectedViews[i]);
         }
         this.dialog.EnableFileControls();
      }

      // Remove file button
      this.remove_Button = new PushButton(this);
      this.remove_Button.text = "Remove images";
      this.remove_Button.toolTip = "Removes the selected images from the list";
      this.remove_Button.onMousePress = function ()
      {
         for (var i = this.dialog.files_List.numberOfChildren - 1; i >= 0; i--)
         {
            if (this.dialog.files_List.child(i).selected)
            {
               engine.files.splice(i, 1);
               this.dialog.files_List.remove(i);
            }
            this.dialog.EnableFileControls();
         }
      }

      // Clear files button
      this.clear_Button = new PushButton(this);
      this.clear_Button.text = "Clear list";
      this.clear_Button.toolTip = "Clears the list of images";
      this.clear_Button.onMousePress = function ()
      {
         this.dialog.files_List.clear();
         engine.files = new Array();
      }

      // Buttons for managing the list of files
      this.files_Buttons = new VerticalSizer;
      this.files_Buttons.scaledSpacing = 6;
      this.files_Buttons.add(this.addFile_Button);
      this.files_Buttons.add(this.addView_Button);
      this.files_Buttons.add(this.remove_Button);
      this.files_Buttons.addSpacing(8);
      this.files_Buttons.add(this.clear_Button);
      this.files_Buttons.addStretch();

      this.target_Group.sizer.add(this.files_List);
      this.target_Group.sizer.add(this.files_Buttons);
   }

   this.EnableFileControls = function ()
   {
      this.remove_Button.enabled = this.files_List.selectedNodes.length > 0;
      this.clear_Button.enabled = this.files_List.numberOfChildren > 0;
   }

   this.CreateTargetGroup();
   this.EnableFileControls();

   // Options
   this.options_Section = new SectionBar(this, "BlurXTerminator Options");
   this.options_Control = new Control(this);
   this.options_Control.sizer = new VerticalSizer;
   this.options_Control.sizer.margin = 10;
   this.options_Control.sizer.scaledSpacing = 4;
   this.options_Section.setSection(this.options_Control);
   this.options_Control.hide();
   this.options_Control.onToggleSection = function (bar, toggleBegin)
   {
      if ( !toggleBegin )
         this.dialog.adjustToContents();
   }

   // Stellar Sharpening Slider
   this.sharp_Control = new NumericControl(this);
   this.sharp_Control.real = true;
   this.sharp_Control.label.text = "Star Sharpening:";
   this.sharp_Control.label.minWidth = this.labelWidth;
   this.sharp_Control.setRange(0, 0.70);
   this.sharp_Control.slider.setRange(0, 100);
   this.sharp_Control.slider.setScaledFixedWidth(300);
   this.sharp_Control.toolTip = "<p>Adjusts the stellar sharpening. This slider is identical to the Sharpen Stars slider in BlurXTerminator.</p>";
   this.sharp_Control.setPrecision(2);
   //this.sharp_Control.edit.minWidth = spinBoxWidth;
   this.sharp_Control.setValue(engine.starSharp);
   this.sharp_Control.sizer.addStretch();
   this.sharp_Control.onValueUpdated = function (value)
   {
      engine.starSharp = value;
   };
   this.options_Control.sizer.add(this.sharp_Control);

   // Stellar Halo Slider
   this.halo_Control = new NumericControl(this);
   this.halo_Control.real = true;
   this.halo_Control.label.text = "Halo Adjustment:";
   this.halo_Control.label.minWidth = this.labelWidth;
   this.halo_Control.setRange(-0.50, 0.50);
   this.halo_Control.slider.setRange(0, 100);
   this.halo_Control.slider.setScaledFixedWidth(292);
   this.halo_Control.toolTip = "<p>Adjusts the stellar halo. This slider is identical to the Adjust Star Halos slider in BlurXTerminator.</p>";
   this.halo_Control.setPrecision(2);
   //this.halo_Control.edit.minWidth = spinBoxWidth;
   this.halo_Control.setValue(engine.starHalo);
   this.halo_Control.sizer.addStretch();
   this.halo_Control.onValueUpdated = function (value)
   {
      engine.starHalo = value;
   };
   this.options_Control.sizer.add(this.halo_Control);
   
   // Convolution Options
   this.conv_Options_Section = new SectionBar(this, "Convolution Options");
   this.conv_Options_Control = new Control(this);
   this.conv_Options_Control.sizer = new VerticalSizer;
   this.conv_Options_Control.sizer.scaledSpacing = 4;
   this.conv_Options_Control.sizer.margin = 10;
   this.conv_Options_Section.setSection(this.conv_Options_Control);
   this.conv_Options_Control.hide();
   this.conv_Options_Control.onToggleSection = function (bar, toggleBegin)
   {
      if ( !toggleBegin )
         this.dialog.adjustToContents();
   }

   // Convolution PSF Slider
   this.psf_Control = new NumericControl(this);
   this.psf_Control.real = true;
   this.psf_Control.label.text = "Convolution PSF:";
   this.psf_Control.label.minWidth = this.labelWidth;
   this.psf_Control.setRange(0, 10);
   this.psf_Control.slider.setRange(0, 100);
   this.psf_Control.slider.setScaledFixedWidth(300);
   this.psf_Control.toolTip = "<p>Controls the size of the convolution PSF. A value of 0 does not convolve the image at all. This is identical to the StdDev slider in the Convolution process.</p>";
   this.psf_Control.setPrecision(2);
   //this.psf_Control.edit.minWidth = spinBoxWidth;
   this.psf_Control.setValue(engine.convolution);
   this.psf_Control.sizer.addStretch();
   this.psf_Control.onValueUpdated = function (value)
   {
      engine.convolution = value;
   };
   this.conv_Options_Control.sizer.add(this.psf_Control);
   
   
   // Convolution Shape Slider
   this.shape_Control = new NumericControl(this);
   this.shape_Control.real = true;
   this.shape_Control.label.text = "PSF Shape:";
   this.shape_Control.label.minWidth = this.labelWidth;
   this.shape_Control.setRange(0.25, 6);
   this.shape_Control.slider.setRange(0, 100);
   this.shape_Control.slider.setScaledFixedWidth(300);
   this.shape_Control.toolTip = "<p>Controls the shape of the convolution PSF. Lower values make the PSF 'tigher'. This is identical to the Shape slider in the Convolution process.</p>";
   this.shape_Control.setPrecision(2);
   //this.psf_Control.edit.minWidth = spinBoxWidth;
   this.shape_Control.setValue(engine.psfShape);
   this.shape_Control.sizer.addStretch();
   this.shape_Control.onValueUpdated = function (value)
   {
      engine.psfShape = value;
   };
   this.conv_Options_Control.sizer.add(this.shape_Control);

   // Output images
   this.output_Section = new SectionBar(this, "Output Images");
   this.output_Control = new Control(this);
   this.output_Control.sizer = new VerticalSizer;
   this.output_Control.sizer.scaledSpacing = 4;
   this.output_Control.sizer.margin = 10;
   this.output_Section.setSection(this.output_Control);
   this.output_Control.hide();
   this.output_Control.onToggleSection = function (bar, toggleBegin)
   {
      if ( !toggleBegin )
         this.dialog.adjustToContents();
   }

   // Directory
   this.outDir_Label = new Label(this);
   this.outDir_Label.text = "Output Directory:";
   this.outDir_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.outDir_Label.setFixedWidth(this.labelWidth);


   this.outDir_Edit = new Edit(this);
   this.outDir_Edit.enabled = !engine.overwrite;
   if (engine.outputDir)
      this.outDir_Edit.text = engine.outputDir;
   this.outDir_Edit.setScaledMinWidth(250);
   this.outDir_Edit.toolTip = "<p>Path of the directory where the aligned images will be written.<br/>" +
      "If it is empty, the images will be written at the same directories as the source images.</p>";
   this.outDir_Edit.onTextUpdated = function (value)
   {
      if (value.trim().length > 0)
         engine.outputDir = value.trim();
      else
         engine.outputDir = null;
   };

   this.outDir_Button = new ToolButton(this);
   this.outDir_Button.icon = this.scaledResource( ":/icons/select-file.png" );
   this.outDir_Button.setScaledFixedSize( 20, 20 );
   this.outDir_Button.toolTip = "<p>Select the output directory.</p>";
   this.outDir_Button.onClick = function ()
   {
      var gdd = new GetDirectoryDialog();
      if (engine.outputDir)
         gdd.initialPath = engine.outputDir;
      gdd.caption = "Select the output directory";
      if (gdd.execute())
      {
         engine.outputDir = gdd.directory;
         this.dialog.outDir_Edit.text = gdd.directory;
      }
   };
   
   var self = this;

   this.outDir_Sizer = new HorizontalSizer;
   this.outDir_Sizer.scaledSpacing = 4;
   this.outDir_Sizer.add(this.outDir_Label);
   this.outDir_Sizer.add(this.outDir_Edit, 100);
   this.outDir_Sizer.add(this.outDir_Button);
   this.output_Control.sizer.add(this.outDir_Sizer);

   // IMAGE SUFFIX
   this.suffix_Label = new Label(this);
   this.suffix_Label.text = "Output file suffix:";
   this.suffix_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.suffix_Label.setFixedWidth(this.labelWidth);

   this.suffix_Edit = new Edit(this);
   this.suffix_Edit.enabled = !engine.overwrite;
   this.suffix_Edit.text = engine.suffix ? engine.suffix : "";
   this.suffix_Edit.minWidth = this.font.width("_mosaicXXXXX");
   this.suffix_Edit.toolTip = "<p>This suffix will be appended to the filename when saving each image.</p>";
   this.suffix_Edit.onTextUpdated = function (value)
   {
      engine.suffix = value ? value.trim() : "";
   };
   
   this.filetype_Label = new Label(this);
   this.filetype_Label.text = "File Type:";
   this.filetype_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;
   this.filetype_Combo = new ComboBox(this);
   this.filetype_Combo.enabled = !engine.overwrite;
   this.filetype_Combo.editEnabled = false;
   this.filetype_Combo.toolTip = "<p>Specify the file format for the output images.</p>";
   this.filetype_Combo.addItem(".tiff");
   this.filetype_Combo.addItem(".xisf");
   this.filetype_Combo.addItem(".fits");
   this.filetype_Combo.currentItem = engine.fileType ? engine.fileType : 0;
   this.filetype_Combo.onItemSelected = function ()
   {
      engine.fileType = this.currentItem;
   }
   

   this.suffix_Sizer = new HorizontalSizer;
   this.suffix_Sizer.scaledSpacing = 4;
   this.suffix_Sizer.add(this.suffix_Label);
   this.suffix_Sizer.add(this.suffix_Edit);
   this.suffix_Sizer.addSpacing(10);
   this.suffix_Sizer.add(this.filetype_Label);
   this.suffix_Sizer.add(this.filetype_Combo);
   this.suffix_Sizer.addStretch();
   this.output_Control.sizer.add(this.suffix_Sizer);

   this.errorPolicy_Label = new Label(this);
   this.errorPolicy_Label.text = "On error:";
   this.errorPolicy_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;
   this.errorPolicy_Combo = new ComboBox(this);
   this.errorPolicy_Combo.editEnabled = false;
   this.errorPolicy_Combo.toolTip = "<p>Specify what to do if there are errors during the process.</p>";
   this.errorPolicy_Combo.addItem("Continue");
   this.errorPolicy_Combo.addItem("Abort");
   this.errorPolicy_Combo.addItem("Ask User");
   this.errorPolicy_Combo.currentItem = engine.errorPolicy ? engine.errorPolicy : 0;
   this.errorPolicy_Combo.onItemSelected = function ()
   {
      engine.errorPolicy = this.currentItem;
   };

   
   // Overwrite
   this.overwrite_Check = new CheckBox(this);
   this.overwrite_Check.text = "Overwrite";
   this.overwrite_Check.checked = engine.overwrite;
   this.overwrite_Check.onCheck = function (checked)
   {
      engine.overwrite = checked;
	  self.outDir_Edit.enabled = !checked;
	  self.suffix_Edit.enabled = !checked;
	  self.filetype_Combo.enabled = !checked;
   };
   
   this.output_Control.sizer.addSpacing(10);

   this.outputSetting_Sizer = new HorizontalSizer;
   this.outputSetting_Sizer.scaledSpacing = 4;
   this.outputSetting_Sizer.add(this.overwrite_Check);
   this.outputSetting_Sizer.addSpacing(25);
   this.outputSetting_Sizer.add(this.errorPolicy_Label);
   this.outputSetting_Sizer.add(this.errorPolicy_Combo);
   this.outputSetting_Sizer.addSpacing(25);
   this.outputSetting_Sizer.addStretch();
   this.output_Control.sizer.add(this.outputSetting_Sizer);

   // usual control buttons

   this.newInstanceButton = new ToolButton(this);
   this.newInstanceButton.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstanceButton.setScaledFixedSize( 20, 20 );
   this.newInstanceButton.toolTip = "New Instance";
   this.newInstanceButton.onMousePress = function ()
   {
      this.hasFocus = true;

      engine.SaveParameters();

      this.pushed = false;
      this.dialog.newInstance();
   };

   this.reset_Button = new ToolButton(this);
   this.reset_Button.icon = this.scaledResource( ":/icons/reload.png" );
   this.reset_Button.setScaledFixedSize( 20, 20 );
   this.reset_Button.toolTip = "<p>Resets all settings to default values.<br />" +
      "This action closes the dialog, so the script has to be executed again for changes to take effect.</p>";
   this.reset_Button.onClick = function ()
   {
      var msg = new MessageBox("Do you really want to reset all settings to their default values?",
         TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No);
      var res = msg.execute();
      if (res == StdButton_Yes)
      {
         Settings.remove(SETTINGS_MODULE);
         this.dialog.resetRequest = true;
         this.dialog.cancel();
      }
   };

   this.ok_Button = new PushButton(this);
   this.ok_Button.text = "Execute";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function ()
   {
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton(this);
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function ()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.scaledSpacing = 6;
   this.buttons_Sizer.add(this.newInstanceButton);
   this.buttons_Sizer.add(this.reset_Button);
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add(this.ok_Button);
   this.buttons_Sizer.add(this.cancel_Button);

   // Global sizer

   this.sizer = new VerticalSizer;
   this.sizer.scaledMargin = 8;
   this.sizer.scaledSpacing = 6;
   this.sizer.add(this.helpLabel);
   this.sizer.addSpacing(4);
   this.sizer.add(this.target_Group);
   this.sizer.add(this.options_Section);
   this.sizer.add(this.options_Control);
   this.sizer.add(this.conv_Options_Section);
   this.sizer.add(this.conv_Options_Control);
   this.sizer.add(this.output_Section);
   this.sizer.add(this.output_Control);
   this.sizer.addSpacing(8);
   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = TITLE;
   this.adjustToContents();
   this.setFixedSize();
}
StarsOnlyBlurX.prototype = new Dialog;

// -------------------------------------
// ENUMERATION ErrorPolicy

function ErrorPolicy()
{
}
ErrorPolicy.prototype.Continue = 0;
ErrorPolicy.prototype.Abort = 1;
ErrorPolicy.prototype.Ask = 2;

function FileType()
{
}
FileType.prototype.Tiff = 0;
FileType.prototype.Xisf = 1;
FileType.prototype.Fits = 2;


function pixelMath(targetView, expression, createImage, imageId, grayscale) {
	var P = new PixelMath;
	P.expression = expression
	P.useSingleExpression = true;
	P.symbols = "m=0.999";
	P.singleThreaded = false;
	P.optimization = true;
	P.createNewImage = createImage;
	P.showNewImage = false;
	P.newImageId = imageId;
	if (grayscale) P.newImageColorSpace = 2;
	else P.newImageColorSpace = PixelMath.prototype.SameAsTarget;
	P.newImageSampleFormat = PixelMath.prototype.SameAsTarget;
	P.executeOn(targetView, true );
}

function getNewName(name)
{
   var newName = name;
   let n = 1;
   while (!ImageWindow.windowById(newName).isNull)
   {
      ++n;
      newName = name + n;
   }
   return newName;
}

function blurX(target, correct_only = false, sharpen_stars = 0.0, adjust_halos = 0.0, sharpen_nonstellar = 0.0) {
	var P = new BlurXTerminator();
	P.correct_only = correct_only;
	P.correct_first = false;
	P.nonstellar_then_stellar = false;
	P.lum_only = false;
	P.sharpen_stars = sharpen_stars;
	P.adjust_halos = adjust_halos;
	P.nonstellar_psf_diameter = 0.00;
	P.auto_nonstellar_psf = true;
	P.sharpen_nonstellar = sharpen_nonstellar;
	P.executeOn(target, true);
}

function convolve(target, psf, shape) {
	var P = new Convolution;
	P.mode = Convolution.prototype.Parametric;
	P.sigma = psf;
	P.shape = shape;
	P.aspectRatio = 1.00;
	P.rotationAngle = 0.00;
	P.filterSource = "";
	P.rescaleHighPass = false;
	P.viewId = "";
	P.executeOn(target, true);
}

function StarsOnlyBlurXEngine()
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      SETTINGS_MODULE,
      "engine",
      new Array(
         [ "files", Ext_DataType_StringArray ],
         [ "starSharp", DataType_UInt32 ],
         [ "starHalo", DataType_UInt32 ],
         [ "suffix", DataType_String ],
         [ "overwrite", DataType_Boolean ],
         [ "errorPolicy", DataType_Int32 ],
         [ "outputDir", DataType_String ],
         [ "fileType", DataType_Int32 ]
      )
   );

   this.files = [];
   this.suffix = "_corrected";
   this.outputDir = "";
   this.overwrite = true;
   this.errorPolicy = ErrorPolicy.prototype.Ask;
   this.fileType = FileType.prototype.Tiff;

   this.starSharp = 0.0;
   this.starHalo = 0.50;
   this.convolution = 0.75;
   this.psfShape = 1.0

   // Select image and get metadata
   this.Init = function (w)
   {
      this.currentWindow = w;

      this.LoadSettings();
      this.LoadParameters();
   };


   this.CalculateAutoParameters = function ()
   {
      if (this.files.length == 0)
         throw "The file list is empty";
   };

   this.GetOutputPath = function (filePath)
   {
      var outDir = null;
      if (!this.outputDir || this.outputDir.length == 0)
         outDir = File.extractDrive(filePath) + File.extractDirectory(filePath);
      else
         outDir = this.outputDir;
      var newPath = outDir + "/" +
         File.extractName(filePath) +
         this.suffix +
         File.extractSuffix(filePath);

      if (!this.overwrite && File.exists(newPath))
      {
         if (this.errorPolicy == ErrorPolicy.prototype.Ask)
         {
            var msg = new MessageBox("The file '" + newPath + "' already exists." + "\nDo you want to overwrite it?",
               TITLE, StdIcon_Error, StdButton_Yes, StdButton_No);
            var res = msg.execute();
            if (res != StdButton_Yes)
               throw "The file '" + newPath + "' already exists.";
         }
         else
            throw "The file '" + newPath + "' already exists.";
      }
      return newPath;
   };

	

   this.Execute = function ()
   {
      this.CalculateAutoParameters();

      // Process the images
      var errors = [];
      for (var i = 0; i < this.files.length; i++)
      {
         console.noteln("\nCorrecting '"+this.files[i]+"' ", (i+1)+"/"+(this.files.length));
         var window1 = null;
         var srcIsFile = !this.files[i].startsWith("window:");
         if (srcIsFile)
            window1 = ImageWindow.open(this.files[i])[0];
         else
            window1 = ImageWindow.windowById(this.files[i].substr(7));
         var resWindow = null;
		if (!window1 || window1.isNull)
		   throw "Error opening image '" + this.files[i] + "'";

		resWindow = window1;
		var original = window1.mainView;
		var tName = getNewName("target");
		pixelMath(original, "$T", true, tName);
		var target = View.viewById(tName);
		var P = new StarXTerminator();
		P.stars = true;
		P.unscreen = true;
		P.overlap = 0.20;
		P.executeOn(target, true);
		var stars = View.viewById(tName+"_stars");
		blurX(stars, false, this.starSharp, this.starHalo);
		convolve(stars, this.convolution, this.psfShape);
		pixelMath(target, "mtf(~m,(mtf(m,"+tName+")+mtf(m,"+tName+"_stars"+")))", false, "");
		pixelMath(original, tName, false, "");
		target.window.forceClose();
		stars.window.forceClose();

		if (srcIsFile)
		{
		   if (this.overwrite) {
			   console.noteln("OVERWRITING");
			   resWindow.saveAs(window1.filePath, false, false, true, false);
		   }
		   else {
		       var newPath = this.GetOutputPath(window1.filePath);
			   var parts = newPath.split('.');
			   newPath = "";
			   for (var j = 0; j<parts.length-1; j++) {
				   newPath += parts[j];
			   }
			   if (this.fileType==0) newPath += ".tiff";
			   if (this.fileType==1) newPath += ".xisf";
			   if (this.fileType==2) newPath += ".fits";
			   resWindow.saveAs(newPath, false, false, true, false);
		   }
		}
		else
		{
		   console.writeln("Result window: ", resWindow.mainView.fullId);
		   resWindow.show();
		}
         if (srcIsFile)
         {
            if (window1 && !window1.isNull)
               window1.forceClose();
         }
         if (errors.length == 0)
            console.writeln("\n<b>Process finished successfully.</b>");
         else
         {
            console.writeln(format("\n<b>Process finished with %d errors.</b>", errors.length));
            for (var j = 0; j < errors.length; j++)
            {
               console.writeln(errors[j].file + ":");
               console.writeln("    " + errors[j].err);
            }
         }
      }
   };
}

StarsOnlyBlurXEngine.prototype = new ObjectWithSettings;


function CheckVersion(major, minor, release)
{
   if (major == __PI_MAJOR__)
   {
      if (minor == __PI_MINOR__)
         return release <= __PI_RELEASE__;
      else
         return minor < __PI_MINOR__;
   }
   else
      return major < __PI_MAJOR__;
}

function main()
{
   console.abortEnabled = true;

   if (!CheckVersion(1, 8, 4))
   {
      new MessageBox("This script requires at least the version 1.8.4 of PixInsight", TITLE, StdIcon_Error, StdButton_Ok).execute();
      return;
   }
   
   

   var engine = new StarsOnlyBlurXEngine;
   
   if (Parameters.isViewTarget)
   {
      engine.Init(Parameters.targetView.window);

      // When executing on a target the debug windows are not necessary
      engine.useActive = true;
   }
   else
   {
      do {
         engine.Init(ImageWindow.activeWindow);
         var dialog = new StarsOnlyBlurX(engine);
         var res = dialog.execute();

         if (!res)
         {
            if (dialog.resetRequest)
               engine = new StarsOnlyBlurXEngine();
            else
               return;
         }
      } while (!res);
      engine.SaveSettings();
   }

   engine.Execute();
}

main();
