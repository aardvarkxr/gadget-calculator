import { AvGrabButton, AvModel, AvPanel, AvPrimitive, AvStandardGrabbable, AvTransform, DefaultLanding, GrabbableStyle, PrimitiveType, renderAardvarkRoot } from '@aardvarkxr/aardvark-react';
import { AvVolume, EVolumeType, g_builtinModelBox } from '@aardvarkxr/aardvark-shared';
import * as React from 'react';

export const g_CalcIcon = "models/CalculatorIcon.glb";
export const g_CalcHandle = "models/CalculatorHandle.glb";

export const g_Button0 = "models/button0.glb";
export const g_Button1 = "models/button1.glb";
export const g_Button2 = "models/button2.glb";
export const g_Button3 = "models/button3.glb";
export const g_Button4 = "models/button4.glb";
export const g_Button5 = "models/button5.glb";
export const g_Button6 = "models/button6.glb";
export const g_Button7 = "models/button7.glb";
export const g_Button8 = "models/button8.glb";
export const g_Button9 = "models/button9.glb";

export const g_ButtonPlus 		= "models/buttonPlus.glb";
export const g_ButtonMinus 		= "models/buttonMinus.glb";
export const g_ButtonDivide 	= "models/buttonDivide.glb";
export const g_ButtonMultiply 	= "models/buttonMultiply.glb";
export const g_ButtonEquals 	= "models/buttonEquals.glb";
export const g_ButtonDecimal 	= "models/buttonDecimal.glb";
export const g_ButtonClear 		= "models/buttonClear.glb";

enum CalcKey
{
	Number0 	= 0,
	Number1 	= 1,
	Number2 	= 2,
	Number3 	= 3,
	Number4 	= 4,
	Number5 	= 5,
	Number6 	= 6,
	Number7 	= 7,
	Number8 	= 8,
	Number9 	= 9,

	OpPlus 		= 10,
	OpMinus 	= 11,
	OpMultiply	= 12,
	OpDivide	= 13,
	OpEquals	= 14,
	OpDecimal	= 15,
	OpClear		= 16,
}

enum CalcState
{
	ShowingPrevious,
	Number,
	StartingNumber,
	Error,
}

class CalcImpl
{
	private state = CalcState.StartingNumber;
	private decimalPlace: number = 1;
	private currentValue: number = 0;
	private previousValue: number = 0;
	private sign: number = 1;
	private pendingOperation: CalcKey = CalcKey.OpEquals;

	constructor()
	{}

	public processKey( key: CalcKey )
	{
		if( key == CalcKey.OpClear )
		{
			// clear always clears no matter the state
			this.state = CalcState.StartingNumber;
			this.decimalPlace = 1;
			this.currentValue = 0;
			this.previousValue = 0;
			this.sign = 1;
			this.pendingOperation = CalcKey.OpEquals;
			return;
		}

		switch( this.state )
		{
			case CalcState.ShowingPrevious:
				switch( key )
				{
					case CalcKey.OpMinus:
					case CalcKey.OpPlus:
					case CalcKey.OpMultiply:
					case CalcKey.OpDivide:
					case CalcKey.OpEquals:
						this.state = CalcState.StartingNumber;
						this.pendingOperation = key;
						break;

					default:
						this.state = CalcState.Number;
						this.processKey_Number( key );
				}
				break;

			case CalcState.Error:
				this.state = CalcState.Number;
				this.processKey_Number( key );
				break;

			case CalcState.StartingNumber:
				this.state = CalcState.Number;
				if( key == CalcKey.OpMinus )
				{
					// this is a negative number
					this.sign = -1;
					break;
				}
				// FALL THROUGH TO NUMBER!

			case CalcState.Number:
				this.processKey_Number( key );
				break;
		}

		console.log( `After processKey ${ CalcKey[ key ] }: state: ${ CalcState[ this.state ]}, decimalPlace: ${ this.decimalPlace }, `
			+ `currentValue: ${ this.currentValue }, previousValue: ${ this.previousValue }, pendingOperation: ${ CalcKey[ this.pendingOperation ] }` );
	}

	private processKey_Number( key: CalcKey )
	{
		switch( key )
		{
			case CalcKey.Number0:
			case CalcKey.Number1:
			case CalcKey.Number2:
			case CalcKey.Number3:
			case CalcKey.Number4:
			case CalcKey.Number5:
			case CalcKey.Number6:
			case CalcKey.Number7:
			case CalcKey.Number8:
			case CalcKey.Number9:
				let digit = key as number;
				if( this.decimalPlace < 1 )
				{
					this.currentValue += digit * this.decimalPlace;
					this.decimalPlace /= 10;
				}
				else
				{
					this.currentValue = this.currentValue * 10 + digit;
				}
				break;

			case CalcKey.OpDecimal:
				if( this.decimalPlace < 1 )
				{
					// we've already had a decimal place. Just ignore the
					// second one
				}
				else
				{
					this.decimalPlace = 0.1;
				}
				break;

			case CalcKey.OpPlus:
			case CalcKey.OpMinus:
			case CalcKey.OpMultiply:
			case CalcKey.OpDivide:
			case CalcKey.OpEquals:
				this.resolvePendingOp();
				this.pendingOperation = key;
				this.decimalPlace = 1;
				this.currentValue = 0;
				this.sign = 1;
				this.state = CalcState.ShowingPrevious;
		}
	}

	private resolvePendingOp()
	{
		let realCurrentValue = this.sign * this.currentValue;
		switch( this.pendingOperation )
		{
			case CalcKey.OpDivide:
				if( this.currentValue == 0 )
				{
					this.setError();
				}
				else
				{
					this.previousValue = this.previousValue / realCurrentValue;
				}
				break;

			case CalcKey.OpMultiply:
				this.previousValue = this.previousValue * realCurrentValue;
				break;

			case CalcKey.OpMinus:
				this.previousValue = this.previousValue - realCurrentValue;
				break;
			case CalcKey.OpPlus:
				this.previousValue = this.previousValue + realCurrentValue;
				break;

			case CalcKey.OpEquals:
				this.previousValue = realCurrentValue;
				break;
		}
		this.pendingOperation = CalcKey.OpEquals;
	}

	private setError()
	{
		this.state = CalcState.Error;
	}

	public get output(): string
	{
		switch( this.state )
		{
			case CalcState.Error:
				return "Error";

			case CalcState.StartingNumber:
				return "";

			case CalcState.Number:
				if( this.sign == -1 && this.currentValue == 0 )
					return "-";
				else
					return ( this.sign * this.currentValue ).toString();
			
			case CalcState.ShowingPrevious:
				return this.previousValue.toString();
		}
	}
}

const k_cellSize = 0.03;
const k_buttonScale = 0.25;

const k_grabbableVolume: AvVolume =
{
	type: EVolumeType.AABB,
	aabb: 
	{
		xMin: -2.0 * k_cellSize,
		xMax: 2.0 * k_cellSize,
		yMin: -1.5 * k_cellSize,
		yMax: -0.5 * k_cellSize,
		zMin: -0.1 * k_cellSize,
		zMax: 0.1 * k_cellSize,
	}
};

class MyGadget extends React.Component< {}, {} >
{
	private impl = new CalcImpl();

	constructor( props: any )
	{
		super( props );
		this.state = {};
	}

	private renderKey( buttonModel: string, x: number, y: number, key: CalcKey )
	{

		return <AvTransform translateX={ x * k_cellSize } translateY={ y * k_cellSize} 
			uniformScale={ k_buttonScale } rotateX={ 90 }>
			<AvGrabButton modelUri={ buttonModel } onClick={ ()=> 
				{ 
					this.impl.processKey( key );
					this.forceUpdate();
				} }/>
		</AvTransform>
	}

	public render()
	{
		return (
			<AvStandardGrabbable volume={ k_grabbableVolume }
				appearance={
					<AvTransform uniformScale={ k_buttonScale }
						translateY={ k_cellSize * -1 }
						rotateX={ 90 }>
							<AvModel uri={ g_CalcHandle } />
						</AvTransform> }
				style={ GrabbableStyle.Gadget } remoteInterfaceLocks={ [] } >

				{ this.renderKey( g_Button0, -1, 0.5, CalcKey.Number0 ) }
				{ this.renderKey( g_ButtonDecimal, 0.5, 0.5, CalcKey.OpDecimal ) }

				{ this.renderKey( g_Button1, -1.5, 1.5, CalcKey.Number1 ) }
				{ this.renderKey( g_Button2, -0.5, 1.5, CalcKey.Number2 ) }
				{ this.renderKey( g_Button3,  0.5, 1.5, CalcKey.Number3 ) }
				
				{ this.renderKey( g_Button4, -1.5, 2.5, CalcKey.Number4 ) }
				{ this.renderKey( g_Button5, -0.5, 2.5, CalcKey.Number5 ) }
				{ this.renderKey( g_Button6,  0.5, 2.5, CalcKey.Number6 ) }

				{ this.renderKey( g_Button7, -1.5, 3.5, CalcKey.Number7 ) }
				{ this.renderKey( g_Button8, -0.5, 3.5, CalcKey.Number8 ) }
				{ this.renderKey( g_Button9,  0.5, 3.5, CalcKey.Number9 ) }

				{ this.renderKey( g_ButtonEquals, 1.5, 1, CalcKey.OpEquals ) }
				{ this.renderKey( g_ButtonPlus,   1.5, 3, CalcKey.OpPlus ) }
				{ this.renderKey( g_ButtonMinus,  1.5, 4.5, CalcKey.OpMinus ) }

				{ this.renderKey( g_ButtonClear, 	-1.5, 4.5, CalcKey.OpClear ) }
				{ this.renderKey( g_ButtonMultiply, -0.5, 4.5, CalcKey.OpMultiply ) }
				{ this.renderKey( g_ButtonDivide, 	 0.5, 4.5, CalcKey.OpDivide ) }

				<AvTransform translateY={ k_cellSize * 5.7 }>
					<AvPrimitive type={ PrimitiveType.Cube } 
						width={ k_cellSize * 4 } height={ k_cellSize * 1.0 } depth={ 0.005 }
						color="black"/>
					<AvTransform translateZ={ 0.002 }>
						<AvPanel widthInMeters={ k_cellSize * 4.2 } >
							<div className="GadgetOutput">{ this.impl.output }</div>
						</AvPanel>
					</AvTransform>
				</AvTransform>
			</AvStandardGrabbable>
			);
	}
}


class CalcTester extends React.Component< {}, {} >
{
	private impl = new CalcImpl();

	private renderKey( glyph: string, key: CalcKey )
	{
		return <div className="Key" onClick={ 
			() => 
			{ 
				this.impl.processKey( key );
				this.forceUpdate();
			}
			}>
			{ glyph }</div>;
	}

	public render()
	{
		return <>
			<DefaultLanding/>
			<div className="Controls">
				<div className="Output">{ this.impl.output }</div>
				<div className="Row">
					{ this.renderKey( "+", CalcKey.OpPlus ) }
					{ this.renderKey( "-", CalcKey.OpMinus ) }
					{ this.renderKey( "X", CalcKey.OpMultiply ) }
					{ this.renderKey( "÷", CalcKey.OpDivide ) }
				</div>
				<div className="Row">
					{ this.renderKey( "7", CalcKey.Number7 ) }
					{ this.renderKey( "8", CalcKey.Number8 ) }
					{ this.renderKey( "9", CalcKey.Number9 ) }
				</div>
				<div className="Row">
					{ this.renderKey( "4", CalcKey.Number4 ) }
					{ this.renderKey( "5", CalcKey.Number5 ) }
					{ this.renderKey( "6", CalcKey.Number6 ) }
				</div>
				<div className="Row">
					{ this.renderKey( "1", CalcKey.Number1 ) }
					{ this.renderKey( "2", CalcKey.Number2 ) }
					{ this.renderKey( "3", CalcKey.Number3 ) }
				</div>
				<div className="Row">
					{ this.renderKey( "0", CalcKey.Number0 ) }
					{ this.renderKey( ".", CalcKey.OpDecimal ) }
					{ this.renderKey( "=", CalcKey.OpEquals ) }
				</div>
			</div>
		</>;
	}
}


renderAardvarkRoot( "root", <MyGadget/>, <CalcTester/> );
